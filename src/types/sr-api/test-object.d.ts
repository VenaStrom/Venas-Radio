
export type TestObject = {
  stringProp: string;
  numberProp: number;
  booleanProp: boolean;
  undefinedProp?: undefined;
  arrayOfNumbers: number[];
  arrayOfBooleans: boolean[];
  arrayOfObjects: {
    nestedString: {
      nestedString: {
      };
      nestedNumber: {
      };
      optional: {
      };
    };
    nestedNumber: {
      nestedString: {
      };
      nestedNumber: {
      };
      optional: {
      };
    };
    optional?: {
      nestedString: {
      };
      nestedNumber: {
      };
      optional: {
      };
    };
  }[];
};
