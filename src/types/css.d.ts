// Declare css module to import
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}