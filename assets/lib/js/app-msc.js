// globals /////////////////

var debug_flag = false


// vue bus /////////////////

var bus = new Vue();


// vue components /////////////////

var MenuComponent =
{
	template: '#galleries-menu',

	props: [ 'settings', 'galleries', 'gallery', 'menu', 'sidemenu' ],

	methods:
	{
		setGallery: function(id)
		{
			bus.$emit('set-gallery', id)
		},
		closeMenu: function()
		{
			bus.$emit('close-menu')
		}
	}
};


var SidebarMenuComponent =
{
	template: '#galleries-sidebar-menu',

	props: [ 'settings', 'galleries', 'gallery', 'menu', 'sidemenu' ],

	methods:
	{
		setGallery: function(id)
		{
			bus.$emit('set-gallery', id)
		},

		closeMenu: function()
		{
			bus.$emit('close-menu')
		}
	}
};


var SelectMenuComponent =
{
	template: '#galleries-select-menu',

	props: [ 'settings', 'galleries' ],

	methods: {

		setSelectGallery: function(event) {
			//alert(event)
			id = event.target.value
			bus.$emit('set-gallery', id)
		}
	}
};

var GalleryComponent =
{
	template: '#gallery-showcase',

	props: [ 'settings', 'gallery', 'photos' ],

	methods:
	{
		setImage: function(index) {
			bus.$emit('set-image', index)
		},

		openMenu: function() {
			bus.$emit('open-menu')
		}
	},

	created: function ()
	{
		// create new masonry
		$('#thumbs_gallery').imagesLoaded( function() {

			// images have loaded
			$('#thumbs_gallery').masonry({ itemSelector: '.thumb-wrapper' })
		})

		//visible()
	},

	updated: function()
	{
		// destroy old masonry
		$('#thumbs_gallery').masonry('destroy')

		// wait a tick
		this.$nextTick(function(){

			// create new masonry
			$('#thumbs_gallery').imagesLoaded( function() {

				// images have loaded
				$('#thumbs_gallery').masonry({ itemSelector: '.thumb-wrapper' })
			});
		})

		//visible()
	},

	watch:
	{
		gallery: function( newGallery ) {
			//console.log('gallery watched')
		},

		photos: function( newPhotos) {
			//console.log('photos watched')
		}
	}
};

var PhotoComponent =
{
	template: '#gallery-photo',

	props: [ 'settings', 'gallery', 'photos' ],

	methods:
	{

	}
};

var ViewerComponent =
{
	template: '#gallery-image-viewer',

	props: [ 'settings', 'image', 'thumbs', 'viewer', 'current' ],

	methods:
	{
		checkImage: function(image)
		{
			$.ajax({
				url: image.filepath, //or your url
				success: function(data)
				{
					alert(image.filepath)
					return image.filepath
				},
				error: function(data)
				{
					alert('lib/php/image.php?img='+image)
					return 'lib/php/image.php?img='+image.filepath
				},
			})
		},

		setImage: function(index)
		{
			bus.$emit('set-image', index)
		},

		prevImage: function()
		{
			bus.$emit('prev-image')
		},

		nextImage: function()
		{
			bus.$emit('next-image')
		},

		clearImage: function()
		{
			bus.$emit('clear-image')
		},

		playVideo: function()
		{
			$('#viewer_image')[0].play()
		}
	}
};


var MessageComponent =
{
	template: '#gallery-message',

	props: [ 'msg' ]
};


var DebugComponent =
{
	template: '#gallery-debugger',

	props: [ 'settings' ]
};


var FooterComponent =
{
	template: '#gallery-footer',

	props: [  ]
};

Vue.directive('visible', {
	bind: function (el, binding, vnode) {
		$(this.el).bind('inview', function(event, visible)
		{
			var self = this
			if (visible == true) {  // element is now visible in the viewport
				console.log('visible: '+$(this))
				self.addClass('img-visible')
				self.attr('src', el.attr('data-src'))

			} else { // element has gone out of viewport
				console.log('not visible: '+$(this))
				self.removeClass('img-visible')
				self.attr('src', "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
			}
		})
	}
})


// minishowcase app /////////////////

var msc = new Vue({
	el: '#msc',

	components:
	{
		'galleries-debugger': DebugComponent,
		'galleries-message': MessageComponent,
		'galleries-menu': MenuComponent,
		'galleries-sidebar-menu': SidebarMenuComponent,
		'galleries-select-menu': SelectMenuComponent,
		'gallery-showcase': GalleryComponent,
		//'gallery-photo': PhotoComponent,
		'gallery-image-viewer': ViewerComponent,
		'gallery-footer': FooterComponent
	},

	data:
	{
		settings: new Object(),
		lang: new Object(),
		galleries: new Object(),
		gallery: new Object(),
		photos: new Object(),
		image: new Object(),
		thumbs: new Array(),
		debug: new Object(),
		msg: new Object(),
		route: '',
		current: 0,
		viewer: false,
		menu: true,
		sidemenu: false
	},

	computed:
	{
		selected: function() {
			sel = ( this.image.filepath !== '' ) ? true : false
			return sel
		}
	},

	watch:
	{
		// watcher example
		//watcher: function (args) {
		//	function content
		//}
	},

	created: function ()
	{
		$('.menu-loader').css('display','block')

		// define all buses
    	bus.$on('set-gallery', this.setGallery)
    	bus.$on('set-photos', this.setPhotos)
    	bus.$on('set-image', this.setImage)
    	bus.$on('prev-image', this.prevImage)
    	bus.$on('next-image', this.nextImage)
    	bus.$on('clear-image', this.clearImage)
    	bus.$on('open-menu', this.openMenu)
    	bus.$on('close-menu', this.closeMenu)
    	bus.$on('shuffle-photos', this.shufflePhotos)

		// define route from hash
		if (window.location.hash !== '') this.route = window.location.hash.substring(1).split('/')

		// fetch settings
    	this.fetchSettings()

    	$('#msc_header').removeClass('hidden')
	},

	destroyed: function ()
	{
    	// destroy all buses
    	bus.$off('set-gallery', this.setGallery)
    	bus.$off('set-photos', this.setPhotos)
    	bus.$off('set-image', this.setImage)
    	bus.$off('prev-image', this.prevImage)
    	bus.$off('next-image', this.nextImage)
    	bus.$off('clear-image', this.clearImage)
    	bus.$off('open-menu', this.openMenu)
    	bus.$off('close-menu', this.closeMenu)
    	bus.$off('shuffle-photos', this.shufflePhotos)
	},

	methods: {

		// fetch settings first
		fetchSettings: function()
		{
			$.getJSON("config/settings.json", function(output) {
				msc.settings = output
				msc.sidemenu = msc.settings.use_side_menu.value
			})
			.done(function() {
				msc.fetchLanguage()
				logger(['msc.settings',msc.settings])
			})
			.fail(function() {
				msc.showMessage('info', 'Error loading settings', 'Error loading settings, using defaults')
				msc.fetchDefaultSettings()
			})
			.always(function() {})
		},

		// fetch settings first
		fetchDefaultSettings: function()
		{
			$.getJSON("config/settings-default.json", function(output) {
				msc.settings = output
				msc.sidemenu = msc.settings.use_side_menu.value
			})
			.done(function() {
				msc.fetchGalleries()
			})
			.fail(function() {
				msc.showMessage('info', 'Error loading default settings', 'Error loading default settings, please reinstall minishowcase.')
			})
			.always(function() {})
		},

		fetchLanguage: function()
		{
			$.getJSON("lib/lang/"+msc.settings.set_language.value+".json", function(output) {
				msc.lang = output
			})
			.done(function() {
				msc.fetchGalleries()
			})
			.fail(function() {
				msc.showMessage('info', 'Error loading language', 'Error loading language ('+msc.settings.set_language.value+'), using default language')
			})
			.always(function() {})
		},

		// fetch all galleries to build the menu
		fetchGalleries: function()
		{
			$.getJSON('lib/php/gateway.php?do=get_menu', function(output) {
				msc.galleries = output
			})
			.done(function() {
				$('.menu-loader').css('display','none')
				$('.main-loader').css('display','none')
				/// parse url for deeplinks
				if (typeof msc.route[0] !== 'undefined') msc.fetchGalleryInfo(msc.route[0])
			})
			.fail(function() {})
			.always(function() {})
		},

		// fetch a particular gallery data
		fetchGalleryInfo: function(id)
		{
			$.getJSON('lib/php/gateway.php?do=get_info&id='+id, function(output) {
				// save info to msc.gallery
				msc.gallery = output
			})
			.done(function() {
				msc.fetchGalleryPhotos(msc.gallery.folder)
			})
			.fail(function() {})
			.always(function() {})
		},

		// fetch a particular gallery photos
		fetchGalleryPhotos: function(id)
		{
			$.getJSON('lib/php/gateway.php?do=get_photos&id='+id, function(output) {
				// save photos to msc.photos
				msc.photos = output
			})
			.done(function() {
				// done fetching gallery photos
				msc.closeMenu()

				if (typeof msc.route[1] !== 'undefined') msc.setImage(msc.route[1])

			})
			.fail(function() {})
			.always(function() {})
		},

		// select a gallery and render it
		setGallery: function(id)
		{
			msc.gallery = {}
			msc.photos = {}
			delete msc.route[1] //= 'undefined' // msc.route.splice(1, 1);
			delete msc.route[2] //= 'undefined' // msc.route.splice(2, 1);
			$('.gallery-loader').css('display','block')
			this.fetchGalleryInfo(id)

			$('.menu-item').removeClass('selected')
			$('#menu-'+id).addClass('selected')

		},

		openMenu: function()
		{
			this.menu = true
		},

		closeMenu: function()
		{
			if (this.gallery.id) this.menu = false
		},

		// load an image in the viewer
		setImage: function(index)
		{
			msc.current = index
			msc.image = msc.photos[index]
			msc.viewer = true

			this.buildThumbNav(index)
			this.$nextTick(function(){
				msc.resizeImageContainer()
			})

			// set hash
			window.location.hash = '#'+msc.image.gallery+'/'+index+'/'+msc.image.file

			// load video
			$("#viewer_image")[0].load()

			logger(['msc.image',msc.image])
		},

		// load previous image in the viewer
		prevImage: function()
		{
			index = ( msc.current-1 >= 0)
						? msc.current-1
						: msc.photos.length-1
			this.setImage(index)
		},

		// load next image in the viewer
		nextImage: function()
		{
			index = ( msc.current+1 <= msc.photos.length-1 )
						? msc.current+1
						: 0
			this.setImage(index)
		},

		// clear an image from the viewer
		clearImage: function()
		{
			window.location.hash = '#'+msc.gallery.id
			msc.image = new Object()
			msc.viewer = false
			return false
		},

		// build thumbnail navigation
		buildThumbNav: function(idx)
		{
			index = Number(idx)
			msc.thumbs = new Object()
			first = 0
			last = msc.photos.length - 1

			// prev thumb
			i = (index-1 >= 0) ? index-1 : last
			msc.thumbs.prev = this.assignThumb(msc.photos[i], i)

			// next thumb
			i = (index+1 < msc.photos.length) ? index+1 : first
			msc.thumbs.next = this.assignThumb(msc.photos[i], i)

		},

		assignThumb: function(image, index)
		{
			object = new Object(image)
			object.index = index
			return object
		},

		resizeImageContainer: function()
		{
			// resize image container
			window_height = $(window).height()

			//navbar_height = $(".navbar").outerHeight(true)
			caption_height = $(".caption").outerHeight(true)

			delta_height = 40

			total_height = caption_height + delta_height //+ navbar_height
			image_height = window_height - total_height

			$(".image").css( "height", image_height )

			msc.resizeImage()

		},

		resizeImage: function()
		{
			// get image container size and shape
			container_width = $(".image").width()
			container_height = $(".image").height()
			container_ratio = container_width / container_height

			// get image size and shape
			image = msc.photos[msc.current]

			//if (image.size === false) alert('msc.gallery.photos['+msc.current+'].size:false')

			image_width = image.img_w
			image_height = image.img_h
			image_ratio = image_width / image_height

			// reshape image to fit container
			// container is wide
			if ( container_width > container_height ) {
				// wider image
				if ( container_ratio > image_ratio ) {
					image_new_height = ( container_height < image_height ) ? container_height : image_height
					image_new_width = ( ( image_width * image_new_height ) / image_height )
				} else {
					image_new_width = ( container_width < image_width ) ? container_width : image_width
					image_new_height = ( ( image_height * image_new_width ) / image_width )
				}
			// container is tall
			} else {
				// taller image
				if ( container_ratio > image_ratio ) {
					image_new_height = ( container_height < image_height ) ? container_height : image_height
					image_new_width = ( ( image_width * image_new_height ) / image_height )
				} else {
					image_new_width = ( container_width < image_width ) ? container_width : image_width
					image_new_height = ( ( image_height * image_new_width ) / image_width )
				}
			}

			if (image.extension == 'mp4') {
				setTimeout(function(){
					msc.resizeVideo()
				}, 100);

			} else {
				// image
				$('#viewer_image').width( image_new_width - 30 )
				$('#viewer_image').height( image_new_height - 30 )
				$('#viewer_image').css( 'margin-top', (container_height-image_new_height)/2 )
				$('#viewer_image_loader').css( 'margin-top', (container_height-image_new_height)/2 )
			}

			bugger( 'container:'+container_width+':'+container_height+' / image:'+image_width+':'+image_height+' / new_image:'+image_new_width+':'+image_new_height )
		},

		resizeVideo: function()
		{
			// video
			container_height = $(".image").height()
			video_aspect_ratio = $('#viewer_image').height() / $('#viewer_image').width()

			//$('#viewer_image').attr( 'data-aspectRatio', video_aspect_ratio )
			$('#viewer_image').removeAttr( 'height' )
			$('#viewer_image').removeAttr( 'width' )

			width = $('#viewer_image').width()
			height = $('#viewer_image').height()
			caption = $(".image-box .caption").height()

			if (width > height) {
				$('#viewer_image').attr( 'width', width )
				$('#viewer_image').attr( 'height', video_aspect_ratio * width )
			} else {
				$('#viewer_image').attr( 'height', height )
				$('#viewer_image').attr( 'width', video_aspect_ratio * height )
			}

			var margin_top = ((container_height - height)/2) - caption

			$('#viewer_image').css( 'margin-top', margin_top )
			$('#viewer_image_loader').css( 'margin-top', margin_top )
		},

		// check hash to load gallery/image if in permalink
		checkRoute: function()
		{
			_path = (msc.route!='') ? msc.route.split('/') : 0

			if (_path) {

				if (_path[0]) {

					gallery_id = (_path[0]) ? _path[0].substr(1, _path[0].length) : 0
					gallery = msc.galleries.filter(function(_gallery){ return _gallery.id == gallery_id })
					//gallery = jQuery.grep(msc.galleries, function(_gallery){ return _gallery.id == gallery_id })
					//msc.setGallery(gallery)

				}

				if (_path[1]) {

					_file = (_path[1]) ? _path[1] : 0
					image = msc.gallery.photos.filter(function(photo){ return photo.file == _file })
					//index = jQuery.grep(msc.gallery.photos, function(_image){ return _image.file == image })
					index = msc.gallery.photos.indexOf(image)
					//msc.setImage(index)

				} else {

					return false

				}
			}
		},

		showMessage: function(type, title, content)
		{
			/*
				message types:
				success
				info
				danger
			*/
			msc.msg.type = type
			msc.msg.title = title
			msc.msg.content = content
			logger(msc.msg)

			$("#msc-admin-message").removeClass('admin-hidden')

			setTimeout(function(){
				msc.msg.title = ''
				msc.msg.content = ''
				msc.msg.type = ''
			}, 3000);
		},

		debug: function(message)
		{
			msc.message = message
		}
	}
});


//// DOCUMENT READY ////
$(document).ready(function()
{
	// set up
	$('.debug-hide').css('visibility', ( (debug) ? 'visible' : 'hidden' ) )

	// resize image container
	msc.resizeImageContainer()

	//visible()
});

$(window).scroll(function(){
	//visible()
	/*
	$('.thumb-img').each(function()
	{
		if ($(this).visible(true, false, 'vertical'))
		{
			$(this).addClass('img-visible')
			$(this).attr('src', $(this).attr('data-src'))
		} else {
			$(this).removeClass('img-visible')
			$(this).attr('src', "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
		}
	})
	*/
})

function visible()
{
	$('.thumb-img').each(function()
	{
		if ($(this).visible(true, false, 'vertical'))
		{
			$(this).addClass('img-visible')
			$(this).attr('src', $(this).attr('data-src'))
		} else {
			$(this).removeClass('img-visible')
			$(this).attr('src', "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
		}
	})
}


//// key navigation /////////////////
$("body").keyup(function(e)
{
	e.preventDefault()

	switch ( e.which ) {

		// left arrow = prev image on viewer
		case 37:
			msc.prevImage()
			break

		// right arrow = next image on viewer
		case 39:
			msc.nextImage()
			break

		// space bar = next image on viewer ?
		case 32:
			//msc.nextImage()
			break

		// escape = close viewer
		case 27:
			msc.clearImage()
			break

		default:
			break
	}
});


//// resize functions /////////////////
$(window).resize(function()
{
	// resize image container
	msc.resizeImageContainer()
});


//// functions /////////////////
function bugger(msg)
{
	if (debug_flag) {
		$(".bug-box").html(msg)
	}
}

function logger(msg)
{
	console.log('----------------------------')
	if (msg.constructor === Array) {
		for (i=0; i<msg.length; i++) {
			console.log(msg[i])
		}
	} else {
		console.log(msg)
	}
}
