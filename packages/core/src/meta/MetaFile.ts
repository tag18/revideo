import {Semaphore, useLogger} from '../utils';
import type {MetaField} from './MetaField';

/**
 * Represents the meta file of a given entity.
 *
 * @remarks
 * This class is used exclusively by our Vite plugin as a bridge between
 * physical files and their runtime representation.
 *
 * @typeParam T - The type of the data stored in the meta file.
 *
 * @internal
 */
export class MetaFile<T> {
  private readonly lock = new Semaphore();
  private ignoreChange = false;
  private cache: T | null = null;
  private metaField: MetaField<T> | null = null;

  public constructor(
    private readonly name: string,
    private source: string | false = false,
  ) {}

  public attach(field: MetaField<T>) {
    if (this.metaField) {
      return;
    }
    
    this.metaField = field;
    
    if (this.cache) {
      this.metaField.set(this.cache);
    }
    
    // Add debug name and store reference to track dispatcher identity
    const dispatcher = (this.metaField as any).value;
    dispatcher._debugName = `MetaFile(${this.name})`;
    dispatcher._instanceId = Math.random().toString(36).slice(2, 9);
    
    console.log('[MetaFile] Attaching:', {
      name: this.name,
      fieldName: field.name,
      fieldType: field.constructor.name,
      dispatcherId: dispatcher._instanceId,
      dispatcher: dispatcher,
    });
    
    // For ObjectMetaField, we need to subscribe to onFieldsChanged instead of onChanged
    // because onChanged only fires when the ObjectMetaField's own value changes,
    // but we want to be notified when its nested fields (like timeEvents) change
    const subscribable = (this.metaField as any).onFieldsChanged || this.metaField?.onChanged;
    const eventDispatcher = (this.metaField as any).event;
    
    console.log('[MetaFile] About to subscribe:', {
      hasOnFieldsChanged: !!(this.metaField as any).onFieldsChanged,
      subscribable: subscribable,
      eventDispatcher: eventDispatcher,
      eventDispatcherType: eventDispatcher?.constructor?.name,
    });
    
    // Tag the event dispatcher so we can track it
    if (eventDispatcher) {
      eventDispatcher._debugName = `MetaFile.event(${this.name})`;
      eventDispatcher._instanceId = Math.random().toString(36).slice(2, 9);
      console.log('[MetaFile] Tagged event dispatcher with ID:', eventDispatcher._instanceId);
    }
    
    subscribable.subscribe(this.handleChanged);
    console.log('[MetaFile] Subscribed to', this.name, 'using', (this.metaField as any).onFieldsChanged ? 'onFieldsChanged' : 'onChanged');
  }

  protected handleChanged = async () => {
    console.log('[MetaFile] handleChanged triggered for', this.name);
    if (import.meta.hot && this.metaField && !this.ignoreChange) {
      const data = this.metaField.serialize();
      console.log('[MetaFile] Saving:', data);
      
      await this.lock.acquire();
      try {
        await this.saveData(data);
      } catch (e: any) {
        useLogger().error(e);
      }
      this.lock.release();
    }
  };

  private async saveData(data: T) {
    if (this.source === false) {
      return;
    }

    if (!this.source) {
      throw new Error(`The meta file for ${this.name} is missing.`);
    }

    if (MetaFile.sourceLookup[this.source]) {
      throw new Error(`Metadata for ${this.name} is already being updated`);
    }

    const source = this.source;
    
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        delete MetaFile.sourceLookup[source];
        reject(`Connection timeout when updating metadata for ${this.name}`);
      }, 1000);
      MetaFile.sourceLookup[source] = () => {
        delete MetaFile.sourceLookup[source];
        resolve();
      };
      import.meta.hot!.send('revideo:meta', {
        source,
        data,
      });
    });
  }

  /**
   * Load new metadata from a file.
   *
   * @remarks
   * This method is called during hot module replacement.
   *
   * @param data - New metadata.
   */
  public loadData(data: T) {
    this.ignoreChange = true;
    this.cache = data;
    this.metaField?.set(data);
    this.ignoreChange = false;
  }

  private static sourceLookup: Record<string, Callback> = {};

  static {
    if (import.meta.hot) {
      import.meta.hot.on('revideo:meta-ack', ({source}) => {
        this.sourceLookup[source]?.();
      });
    }
  }
}
