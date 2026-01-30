import {Readable} from 'stream';

export class ImageStream extends Readable {
  private image: Buffer | null = null;
  private hasData = false;
  private isEnded = false;

  public pushImage(image: Buffer | null) {
    // If stream has already ended, ignore any further pushes
    if (this.isEnded) {
      return;
    }

    // Mark as ended when null is pushed (EOF signal)
    if (image === null) {
      this.isEnded = true;
    }

    this.image = image;
    this.hasData = true;
    this._read();
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  public override _read() {
    if (this.hasData) {
      this.hasData = false;
      this.push(this.image);
    }
  }
}
