
export type TestArray = {
  stringProp: string;
  numberProp: number;
  booleanProp: boolean;
  arrayOfNumbers: number[];
  arrayOfBooleans: boolean[];
  arrayOfObjects: {
    nestedString: string;
    nestedNumber: number;
  }[];
  arrayOfStrings?: string[];
}[];
