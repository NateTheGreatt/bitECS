export const parseArguments = (args: string[]): Record<string, string> => {
  const argsObj = {};
  args.forEach((val, index) => {
    if (val.startsWith("--")) {
      argsObj[val.substring(2)] = args[index + 1];
    }
  });
  return argsObj;
};
