import { Minutes, Seconds, Timestamp } from "./types";

export class __PlaybackProgress {
  private elapsed: Seconds;
  private duration: Seconds;

  constructor(elapsed: Seconds, duration: Seconds) {
    this.elapsed = elapsed;
    this.duration = duration;
  }

  get elapsedPercentage(): number {
    if (this.duration.toNumber() === 0) return 0;
    return (this.elapsed.toNumber() / this.duration.toNumber()) * 100;
  }

  get totalMinutes(): Minutes {
    return this.duration.toMinutes();
  }
  get totalSeconds(): Seconds {
    return this.duration;
  }

  get elapsedMinutes(): Minutes {
    return this.elapsed.toMinutes();
  }
  get elapsedSeconds(): Seconds {
    return this.elapsed;
  }

  get remainingMinutes(): Minutes {
    const remainingSeconds = this.duration.toNumber() - this.elapsed.toNumber();
    return Minutes.from(Math.ceil(remainingSeconds / 60));
  }
  get remainingSeconds(): Seconds {
    const remaining = this.duration.toNumber() - this.elapsed.toNumber();
    return Seconds.from(Math.max(0, remaining));
  }

  toString(): string {
    const elapsed = Timestamp.fromSeconds(this.elapsed);
    const duration = Timestamp.fromSeconds(this.duration);
    return `${elapsed.toString()}/${duration.toString()}`;
  }
}

export class __Timestamp {
  private minutes: Minutes;
  private seconds: Seconds;

  constructor(minutes: Minutes, seconds: Seconds) {
    this.minutes = minutes;
    this.seconds = seconds;
  }

  toString(): string {
    const min = this.minutes.toNumber();
    const sec = this.seconds.toNumber();
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  static fromSeconds(totalSeconds: Seconds): Timestamp {
    const minutes = Minutes.from(Math.floor(totalSeconds.toNumber() / 60));
    const seconds = Seconds.from(totalSeconds.toNumber() % 60);
    return new Timestamp(minutes, seconds);
  }

  static fromMinutes(totalMinutes: Minutes): Timestamp {
    const minutes = Minutes.from(totalMinutes.toNumber());
    const seconds = Seconds.from(0);
    return new Timestamp(minutes, seconds);
  }
}

export class __Seconds {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  toNumber(): number {
    return this.value;
  }

  toMinutes(): Minutes {
    return Minutes.fromSeconds(this);
  }

  static from(value: number): Seconds {
    return new Seconds(value);
  }
}

export class __Minutes {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  toNumber(): number {
    return this.value;
  }

  toSeconds(): Seconds {
    return Seconds.from(this.value * 60);
  }

  static from(value: number): Minutes {
    return new Minutes(value);
  }

  /** !! WARNING Truncates !! */
  static fromSeconds(seconds: Seconds): Minutes {
    return new Minutes(Math.floor(seconds.toNumber() / 60));
  }
}