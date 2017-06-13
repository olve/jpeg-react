module.exports = {
  plugins: {
    //must run before var plugin "Everything that runs before the import plugin will only process the CSS before the imported files are inserted into those documents."
    'postcss-import': {}, 
    'postcss-simple-vars': {},
    'autoprefixer': {},
    'cssnano': {}
  }
}
