
export type TestObject = {
  stringProp: string;
  numberProp: number;
  booleanProp: boolean;
  undefinedProp?: undefined;
  arrayOfStrings: string[];
  arrayOfNumbers: number[];
  arrayOfBooleans: boolean[];
  arrayOfObjects: {
    nestedString: string;
    nestedNumber: number;
    optional?: boolean;
  }[];
};
