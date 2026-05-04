
export type TestArray = {
  stringProp: string;
  numberProp: number;
  booleanProp: boolean;
  arrayOfStrings?: undefined | unknown;
  arrayOfNumbers: number[];
  arrayOfBooleans: boolean[];
  arrayOfObjects?: {
    nestedString: string;
    nestedNumber: number;
    optional?: boolean | undefined;
  }[];
}[];
