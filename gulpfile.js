var
   gulp           = require('gulp'),
   sass           = require('gulp-sass'),
   autoprefixer   = require('gulp-autoprefixer'),
   mmq            = require('gulp-merge-media-queries'),
   pkg            = require('./package.json'),
   paths          = pkg.paths,
   cssfont64      = require('gulp-cssfont64'),      //iconfont base 64
   iconfontCss    = require('gulp-iconfont-css'),   //iconfont css
   iconfont       = require('gulp-iconfont'),       //iconfont
   spritePng      = require("gulp.spritesmith"),    //sprite png
   imagemin       = require("gulp-imagemin"),       //sprite png
   merge          = require('merge-stream'),
   spriteSvg      = require('gulp-svg-sprite'),     //sprite svg
   runSequence    = require('run-sequence'),        // needed for task execution loop at end of file
	 browserSync 		= require('browser-sync').create();
   //uglify         = require('gulp-uglify')


// Build CSS
gulp.task('style', function() {
   return gulp.src(paths.sass.src + '*.scss')
   .pipe(sass({
      sourceComments: true,                  // comment out for final delivery
      sourceMap: '/' + paths.sass.src,       // comment out for final delivery
      outputStyle: 'expanded'                //"compressed" for final delivery
    }))
   .pipe(autoprefixer())
   .pipe(mmq())
   .pipe(gulp.dest(paths.sass.dest));
});

//icon fonts
gulp.task('iconfont', function() {
    var
        iconfont_config = "iconfont-config.scss",       //Config file to generate the .scss file
        iconfont_scss = "_iconfont.scss";               //auto-generated .png sprite

    return gulp.src([paths.iconfont.src + '*.svg'], {base: paths.iconfont.base})      //location of the original svg's
    .pipe(iconfontCss({
        fontName: 'iconfont',
        cssClass: 'iconfont',                            //prefix for the fonts class
        path: paths.iconfont.conf + iconfont_config,     // scss config file
        targetPath: paths.iconfont.destScss + iconfont_scss, // Created scss file by the config file
        fontPath: paths.iconfont.destFontRelative        // location of created fonts relative to .css
    }))

    .pipe(iconfont({
        fontName: 'iconfont',                            // required
        //fontName: 'iconfont64',                        // in case of base 64
        prependUnicode: false,
        formats: ['ttf', 'eot', 'woff'],                 // default, 'woff2' and 'svg' are available
        //formats: ['ttf'],                              // in case of base 64 only use the ttf
        normalize: true,
        fontHeight: 1001,
        centerHorizontally: true
    }))
    .pipe(gulp.dest(paths.iconfont.destFont));
});

// converting the font created in "iconfont" above to base 64
// when using this please use above fontName: 'iconfont64' and only formats: ['ttf']
// also wipe all fonts from the dest folder before you start
// iconfont-config.scss needs to be changed to use base64 (see comments there)

gulp.task('base64', function () {
    return gulp.src(paths.base64css.src + '*.ttf')
    .pipe(cssfont64())
    .pipe(gulp.dest(paths.base64css.destcss));
});

// sprite sheets for png images and scss creation
gulp.task('spritePng', function () {
    var
    spritePng_scss    = "_sprite-png.scss",   //auto-generated .scss file
    spritePng_png     = "sprite-png.png",     //auto-generated .png sprite
    spriteSvg_png2x   = "sprite-png@2x.png";  //auto-generated .png sprite for retina

    var spriteData = gulp.src(paths.spritePng.src + '**/*.**')
    .pipe(spritePng({
        retinaSrcFilter: [paths.spritePng.src_retina + '*.**'],
        retinaImgName: spriteSvg_png2x,
        retinaImgPath: paths.spritePng.destRelative + spriteSvg_png2x,
        imgName: spritePng_png,
        imgPath: paths.spritePng.destRelative + spritePng_png,
        cssName: spritePng_scss,
        cssVarMap: function(sprite) {
            sprite.name = 'sprite-png-' + sprite.name
        },
    }));

    // Pipe image stream through image optimizer and onto disk
    var imgStream = spriteData.img
    .pipe(gulp.dest(paths.spritePng.dest));

    // Pipe CSS stream through CSS optimizer and onto disk
    var cssStream = spriteData.css
    .pipe(gulp.dest(paths.spritePng.dest_css));

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
});


// sprite sheets for svg and scss creation
gulp.task('spriteSvg', function () {
    var
    spriteSvg_config = "sprite-svg-config.scss",    //Config file to generate the .scss file
    spriteSvg_scss = "_sprite-svg.scss",           //auto-generated .scss file
    spriteSvg_svg = "sprite-svg.svg";              //auto-generated .png sprite

    return gulp.src(paths.spriteSvg.src + '*')
    .pipe(spriteSvg({
        shape: {
            spacing: {
                padding: 10
            }
        },
        mode: {
            css: {
                dest: "./",
                layout: "vertical",
                sprite: paths.spriteSvg.destSvg + spriteSvg_svg,
                bust: false,
                render: {
                    scss: {
                        dest: paths.spriteSvg.destScss + spriteSvg_scss,
                        template: paths.spriteSvg.conf + spriteSvg_config
                    }
                }
            }
        },
        variables: {
            mapname: "icons"
        }
    }))
    .pipe(gulp.dest(paths.spriteSvg.srcRoot));
});


// make sure tasks run in a sequence
// possibilities so far:
// runSequence('spritePng','iconfont','spriteSvg','base64','style', callback);

gulp.task('build', function(callback) {
  runSequence('spritePng','iconfont','spriteSvg','style', callback);
});
// gulp.task('default',function() {
//   gulp.watch(paths.sass.src + '**/*.scss',['build']);
// });


gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: 'src'
    },
		files: ["src/**/*.scss", "src/**/*.js", "src/*.html"]
  })
})

//watch
gulp.task('default', ['browserSync', 'css'], function() {
	//watch .scss files
	gulp.watch(paths.sass.src + "**/*.**", ['css']);
	gulp.watch('src/**/*.html');
	gulp.watch(paths.js.src + "**/*.**");
});
