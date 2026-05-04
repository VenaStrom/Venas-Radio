
export type TestObject = {
  stringProp: string;
  numberProp: number;
  booleanProp: boolean;
  undefinedProp?: undefined;
  arrayOfNumbers: number[];
  arrayOfBooleans: boolean[];
  arrayOfObjects: {
    nestedString: string;
    nestedNumber: number;
  }[];
};
