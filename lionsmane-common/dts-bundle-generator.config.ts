const config = {
  entries: [
    {
      filePath: './src/index.ts',
      outFile: './dist/index.d.ts',
      noCheck: false,
    },
  ],
};

// biome-ignore lint/style/noCommonJs: We need to export both
module.exports = config;
