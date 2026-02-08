import { Minutes, Seconds, Timestamp, Hours } from "@/types/types";

export class __PlaybackProgress {
  public duration: Seconds;
  public elapsed: Seconds;

  constructor(duration: Seconds | number, elapsed: Seconds | number) {
    if (typeof duration === "number") {
      duration = Seconds.from(duration);
    }
    if (typeof elapsed === "number") {
      elapsed = Seconds.from(elapsed);
    }
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

  get totalHours(): Hours {
    return Hours.fromSeconds(this.duration);
  }

  get elapsedMinutes(): Minutes {
    return this.elapsed.toMinutes();
  }
  get elapsedSeconds(): Seconds {
    return this.elapsed;
  }

  get elapsedHours(): Hours {
    return Hours.fromSeconds(this.elapsed);
  }

  get remainingMinutes(): Minutes {
    const remainingSeconds = this.duration.toNumber() - this.elapsed.toNumber();
    return Minutes.from(Math.ceil(remainingSeconds / 60));
  }
  get remainingSeconds(): Seconds {
    const remaining = this.duration.toNumber() - this.elapsed.toNumber();
    return Seconds.from(Math.max(0, remaining));
  }

  get remainingHours(): Hours {
    return Hours.fromSeconds(this.remainingSeconds);
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

  get totalSeconds(): Seconds {
    return Seconds.from(this.minutes.toSeconds().toNumber() + this.seconds.toNumber());
  }
  get totalMinutes(): Minutes {
    const totalSeconds = this.minutes.toSeconds().toNumber() + this.seconds.toNumber();
    return Minutes.from(Math.floor(totalSeconds / 60));
  }
  get totalHours(): Hours {
    const totalSeconds = this.minutes.toSeconds().toNumber() + this.seconds.toNumber();
    return Hours.fromSeconds(Seconds.from(totalSeconds));
  }

  constructor(minutes: Minutes, seconds: Seconds) {
    this.minutes = minutes;
    this.seconds = seconds;
  }

  toString(): string {
    const format = (s: number) => Math.floor(s).toString().padStart(2, "0");
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

    const wholeMinutes = Math.floor(this.minutes.toNumber());
    const wholeSeconds = Math.floor(this.seconds.toNumber());

    switch (options.minuteUnit) {
      case "long":
        parts.push(`${wholeMinutes} minuter`);
        break;
      case "short":
        parts.push(`${wholeMinutes} min`);
        break;
      case "none":
        parts.push(wholeMinutes.toString());
        break;
      case "hide":
        break;
    }

    switch (options.secondUnit) {
      case "long":
        parts.push(`${wholeSeconds} sekunder`);
        break;
      case "short":
        parts.push(`${wholeSeconds} sek`);
        break;
      case "none":
        parts.push(wholeSeconds.toString());
        break;
      case "hide":
        break;
    }

    return parts.join(" ");
  }

  static fromSeconds(totalSeconds: Seconds | number): Timestamp {
    if (typeof totalSeconds === "number") {
      totalSeconds = Seconds.from(totalSeconds);
    }

    if (!(totalSeconds instanceof Seconds)) {
      throw new Error("totalSeconds must be an instance of Seconds or a number");
    }

    const minutes = Minutes.from(Math.floor(totalSeconds.toNumber() / 60));
    const seconds = Seconds.from(totalSeconds.toNumber() % 60);
    return new Timestamp(minutes, seconds);
  }

  static fromMinutes(totalMinutes: Minutes): Timestamp {
    const minutes = Minutes.from(totalMinutes.toNumber());
    const seconds = Seconds.from(0);
    return new Timestamp(minutes, seconds);
  }

  static fromHours(totalHours: Hours | number): Timestamp {
    if (typeof totalHours === "number") {
      const totalSeconds = Seconds.from(totalHours * 3600);
      return Timestamp.fromSeconds(totalSeconds);
    }

    return Timestamp.fromSeconds(totalHours.toSeconds());
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

  static fromHours(hours: number): Seconds {
    return Seconds.from(hours * 3600);
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

  static fromHours(hours: number): Minutes {
    return new Minutes(hours * 60);
  }

  static add(a: Minutes, b: Minutes): Minutes {
    return new Minutes(a.toNumber() + b.toNumber());
  }

  static subtract(a: Minutes, b: Minutes): Minutes {
    return new Minutes(a.toNumber() - b.toNumber());
  }
}

export class __Hours {
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  toNumber(): number {
    return this.value;
  }

  toMinutes(): Minutes {
    return Minutes.from(this.value * 60);
  }

  toSeconds(): Seconds {
    return Seconds.from(this.value * 60 * 60);
  }

  toString(): string {
    return this.value.toString();
  }

  static from(value: number): __Hours {
    return new __Hours(value);
  }

  static fromMinutes(minutes: Minutes): __Hours {
    return new __Hours(Math.floor(minutes.toNumber() / 60));
  }

  static fromSeconds(seconds: Seconds): __Hours {
    return new __Hours(Math.floor(seconds.toNumber() / 3600));
  }

  static add(a: __Hours, b: __Hours): __Hours {
    return new __Hours(a.toNumber() + b.toNumber());
  }

  static subtract(a: __Hours, b: __Hours): __Hours {
    return new __Hours(a.toNumber() - b.toNumber());
  }
}