export class InvalidUrlError extends Error {
  constructor(message: string) {
    super(message); // Call the constructor of the base class `Error`
    this.name = 'InvalidUrlError'; // Set the error name to your custom error class name
    Object.setPrototypeOf(this, InvalidUrlError.prototype);
  }
}
