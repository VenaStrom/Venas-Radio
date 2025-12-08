import { Minutes, Seconds, Timestamp } from "./types";

export class __PlaybackProgress {
  public duration: Seconds;
  public elapsed: Seconds;

  constructor(duration: Seconds, elapsed: Seconds) {
    this.duration = duration;
    this.elapsed = elapsed;
  }

  /** 
   * Whole number 0 to 100 (%)
   */
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

  durationTimestamp(): Timestamp {
    return Timestamp.fromSeconds(this.duration);
  }
  elapsedTimestamp(): Timestamp {
    return Timestamp.fromSeconds(this.elapsed);
  }
  remainingTimestamp(): Timestamp {
    return Timestamp.fromSeconds(this.remainingSeconds);
  }
}

export class __Timestamp {
  public minutes: Minutes;
  public seconds: Seconds;

  constructor(minutes: Minutes, seconds: Seconds) {
    this.minutes = minutes;
    this.seconds = seconds;
  }

  toString(): string {
    const format = (s: number) => s.toFixed(0).padStart(2, '0');
    return `${format(this.minutes.toNumber())}:${format(this.seconds.toNumber())}`;
  }

  toFormattedString(
    options:
      {
        minuteUnit?: "none" | "short" | "long" | "hide";
        secondUnit?: "none" | "short" | "long" | "hide";
      } = {
        minuteUnit: "short",
        secondUnit: "short",
      },
  ): string {
    const parts: string[] = [];

    options.minuteUnit = options.minuteUnit || "short";
    options.secondUnit = options.secondUnit || "short";

    switch (options.minuteUnit) {
      case "long":
        parts.push(`${this.minutes.toNumber().toFixed(0)} minuter`);
        break;
      case "short":
        parts.push(`${this.minutes.toNumber().toFixed(0)} min`);
        break;
      case "none":
        parts.push(this.minutes.toNumber().toFixed(0));
        break;
      case "hide":
        break;
    }

    switch (options.secondUnit) {
      case "long":
        parts.push(`${this.seconds.toNumber().toFixed(0)} sekunder`);
        break;
      case "short":
        parts.push(`${this.seconds.toNumber().toFixed(0)} sek`);
        break;
      case "none":
        parts.push(this.seconds.toNumber().toFixed(0));
        break;
      case "hide":
        break;
    }

    return parts.join(" ");
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

  toString(): string {
    return this.value.toString();
  }

  static from(value: number): Seconds {
    return new Seconds(value);
  }

  static add(a: Seconds, b: Seconds): Seconds {
    return new Seconds(a.toNumber() + b.toNumber());
  }

  static subtract(a: Seconds, b: Seconds): Seconds {
    return new Seconds(a.toNumber() - b.toNumber());
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

  toString(): string {
    return this.value.toString();
  }

  static from(value: number): Minutes {
    return new Minutes(value);
  }

  /** !! WARNING Truncates !! */
  static fromSeconds(seconds: Seconds): Minutes {
    return new Minutes(Math.floor(seconds.toNumber() / 60));
  }

  static add(a: Minutes, b: Minutes): Minutes {
    return new Minutes(a.toNumber() + b.toNumber());
  }

  static subtract(a: Minutes, b: Minutes): Minutes {
    return new Minutes(a.toNumber() - b.toNumber());
  }
}