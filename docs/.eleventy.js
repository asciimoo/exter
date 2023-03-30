module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("static/");
	return {
        layout: "templates/base.html",
		dir: {
			input: "pages",
			output: "dist"
		}
	}
};
