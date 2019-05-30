// vue bus

var bus = new Vue();



// vue components

var LoginComponent = {
	
	template: '#admin-login',
	
	props: [ 'logged' ],
	
	data: function()
	{
		return {
			username: '',
			password: ''
		}
	},
	
	methods: {
		
		logIn: function(password)
		{
			bus.$emit('log-in', password)
		},
		
		savePassword: function(password)
		{
			bus.$emit('save-password', password)
		},
		
		checkPasswordFile: function()
		{
			bus.$emit('check-password-file')
		}
	}
};

var MessageComponent = {
	
	template: '#admin-message',
	
	props: [ 'msg' ],
	
	methods: {
		
	}

};

var MenuComponent = {
	
	template: '#admin-menu',
	
	props: [ 'section', 'galleries', 'modules' ],
	
	data: function() {
		return {
			selected: '',
			route: ''
		}
	},
	
	created: function () {
		
		//if (window.location.hash) admsc.route = window.location.hash.substring(1).split("/")
		//if (admsc.route[0]) this.selected = admsc.route[0]
		
	},
	
	methods: {
		
		showSection: function(id) {
			bus.$emit('show-section', id)
		},
		
		fetchGallery: function(id) {
			this.selected = id
			bus.$emit('fetch-gallery', id)
		}
		
	}

};

var SettingsComponent = {
	
	template: '#admin-settings',
	
	props: [ 'settings', 'galleries' ],
	
	methods: {
		
		submitSetting: function(setting,value) {
			bus.$emit('set-setting', setting, value)
		},
		
		saveSettings: function(settings) {
			bus.$emit('save-settings', settings)
		}
		
	}

};

var GalleriesComponent = {
	
	template: '#admin-galleries',
	
	props: [ 'galleries', 'gallery', 'photos' ],
	
	methods: {
		
		fetchGallery: function(id) {
			bus.$emit('fetch-gallery', id)
		},
		
		setImage: function(image) {
			bus.$emit('set-image', image)
		},
		
		showGalleries: function() {
			bus.$emit('show-galleries', 'galleries')
		}
		
	}

};

var ThumbnailsComponent = {
	
	template: '#admin-thumbnails',
	
	props: [ 'image', 'images', 'message' ],
	
	methods: {
		
		setImage: function(image) {
			bus.$emit('set-image', image)
		},
		
		getImages: function()
		{
			bus.$emit('get-images')
		},
		
		createThumb: function()
		{
			bus.$emit('create-thumbs')
		}
		
	}

};

var ViewerComponent = {

	template: '#admin-image-viewer',
	
	props: [ 'image', 'viewer' ],
	
	methods: {
		
		clearImage: function() {
			bus.$emit('clear-image')
		}
		
	},
	
	updated: function() {
		
	}
	
};

// minishowcase admin app

var admsc;

admsc = new Vue({
	el: '#admin-app',

	data:
	{
		logged: { 'in':null, 'file':null, 'file':null },
		settings: new Object(),
		galleries: new Object(),
		gallery: new Object(),
		photos: new Object(),
		image: new Object(),
		viewer: false,
		msg: { 'type':'', 'title':'', 'content':''},
		route: '',
		section: '',
		thumb_message: {'status':{},'response':{}},
		thumb_images: new Object(),
		thumb_image: new Object(),
		modules: {
			'settings':true,
			'galleries':false,
			'thumbnails':true
		}
		
	},
	
	components:
	{
		'admin-login': LoginComponent,
		'admin-menu': MenuComponent,
		'admin-message': MessageComponent,
		'admin-galleries': GalleriesComponent,
		'admin-settings': SettingsComponent,
		'admin-image-viewer': ViewerComponent,
		'admin-thumbnails': ThumbnailsComponent
	},
	
	created: function ()
	{
		
		//start loader
		$('.admin-loader').css('display','block')
		
		// define route from hash
		//if (window.location.hash) this.route = window.location.hash.substring(1).split("/")
		
		// if logged
		this.checkPasswordFile()
		
		// fetch settings
		//this.fetchSettings()
		
		// define all buses
		bus.$on('log-in', this.logIn)
		bus.$on('save-password', this.savePassword)
		bus.$on('check-password-file', this.checkPasswordFile)
		bus.$on('show-section', this.showSection)
		bus.$on('set-setting', this.setSetting)
		bus.$on('save-settings', this.saveSettings)
		bus.$on('fetch-gallery', this.fetchGalleryInfo)
		bus.$on('set-image', this.setImage)
		bus.$on('clear-image', this.clearImage)
		bus.$on('show-galleries', this.showGalleries)
		bus.$on('get-images', this.getImages)
		bus.$on('create-thumbs', this.createThumb)
	},
	
	destroyed: function ()
	{
			// destroy all buses
		bus.$off('log-in', this.logIn)
		bus.$off('save-password', this.savePassword)
		bus.$off('check-password-file', this.checkPasswordFile)
		bus.$off('show-section', this.showSection)
		bus.$off('set-setting', this.setSetting)
		bus.$off('save-settings', this.saveSettings)
		bus.$off('fetch-gallery', this.fetchGalleryInfo)
		bus.$off('set-image', this.setImage)
		bus.$off('clear-image', this.clearImage)
		bus.$off('show-galleries', this.showGalleries)
		bus.$off('get-images', this.getImages)
		bus.$off('create-thumbs', this.createThumb)
		
	},

	methods: {
		
		checkPasswordFile: function()
		{
			console.log('checkPasswordFile')
			
			if (this.logged.in)
			{
				console.log('init')
				this.init()
				
			} else
			{
				$.ajax({
					url:'../lib/php/gateway.php?do=check_password_file',
					method: 'POST',
					dataType: "json",
					error: function( output )
					{
						console.log(output)
						//something went wrong
					},
					success: function( output )
					{
						console.log(output)
						//everything is awesome
						out = JSON.parse(output)
						console.log(out.file)
						admsc.logged.file = out.file
						console.log(out.in)
						admsc.logged.in = out.in
						
						if (admsc.logged.in) {
							admsc.init()
						}
					}
				});
			}
		},
		
		savePassword: function(username, password)
		{
			console.log('savePassword')
			
			$.ajax({
				url:'../lib/php/gateway.php?do=save_password',
				method: 'POST',
				dataType: "json",
			    //data: { 'username': admsc.username, 'password': admsc.password },
			    data: { 'password': admsc.password },
				error: function( output )
				{
					console.log(output)
					//something went wrong
					admsc.showMessage({'type':'danger','title':'Failed','content':'Your password could not be saved. Please try again.'})
				},
				success: function( output )
				{
					console.log(output)
					//everything is awesome
					admsc.showMessage({'type':'info','title':'Success','content':'Your password has been saved successfully.'})
					admsc.logged.file = true
				}
			});
		},
		
		// login
		logIn: function()
		{
			// hide login
			this.logged.in = true
			
			// init app
			this.init()
			
			return false
		},
		
		init: function()
		{
			// define route from hash
			if (window.location.hash) this.route = window.location.hash.substring(1).split("/")
			
			// fetch settings
			this.fetchSettings()
		},
		
		// fetch settings first
		fetchSettings: function()
		{
			$.getJSON("../config/settings.json", function(output) {
				admsc.settings = output
			})
			.done(function() {
				//admsc.fetchGalleries()
				if (admsc.route[0]) admsc.showSection(admsc.route[0])
				else admsc.showSection('settings')
				
				admsc.fetchGalleries()
				
				$('.admin-loader').css('display','none')
			})
			.fail(function() {})
			.always(function() {})
		},
		
		// fetch all galleries to build the menu
		fetchGalleries: function()
		{
			$('.admin-loader').css('display','block')
			
			$.getJSON('../lib/php/gateway.php?do=menu', function(output) {
				admsc.galleries = output
			})
			.done(function() {
				//if (admsc.route[0]) admsc.showSection(admsc.route[0])
				if (admsc.route[1]) admsc.fetchGalleryInfo(admsc.route[1])
				$('.admin-loader').css('display','none')
			})
			.fail(function() {})
			.always(function() {})
		},
		
		// fetch a particular gallery data
		fetchGalleryInfo: function(id)
		{
			$.getJSON('../lib/php/gateway.php?do=info&id='+id, function(output) {
				// save info to msc.gallery
				admsc.gallery = output
				logger(admsc.gallery)
			})
			.done(function() {
				admsc.fetchGalleryPhotos(admsc.gallery.folder)
			})
			.fail(function() {})
			.always(function() {})
		},
		
		// fetch a particular gallery photos
		fetchGalleryPhotos: function(id)
		{
			$.getJSON('../lib/php/gateway.php?do=photos&id='+id, function(output) {
				// save photos to msc.photos
				admsc.photos = output
				logger(admsc.photos)
			})
			.done(function() {
				// done fetching gallery photos
				//alert('gallery fetched')
			})
			.fail(function() {})
			.always(function() {})
		},
		
		setSetting: function(setting, value)
		{
			admsc.settings[setting].value = value
		},
		
		saveSettings: function()
		{
			logger(['admsc.settings', admsc.settings])
			
			$.getJSON("../lib/php/gateway.php?do=save_settings&data="+JSON.stringify(admsc.settings), function(output)
			{
				logger(output)
				msg = output
				admsc.showMessage( msg )
			})
			.done(function() {})
			.fail(function() {})
			.always(function() {})
		},
		
		showMessage: function(msg)
		{
			console.log('msg:'+JSON.stringify(msg))
			admsc.msg.type = msg.type
			admsc.msg.title = msg.title
			admsc.msg.content = msg.content
			
			$("#msc-admin-message").removeClass('admin-hidden')
			
			setTimeout(function(){ 
				admsc.msg.title = ''
				admsc.msg.content = ''
				admsc.msg.type = ''
			}, 3000);
		},
		
		// show selected section
		showSection: function(id) 
		{
			admsc.section = id
			window.location.hash = '#'+id
			//if (id=='galleries') 
			$(".admin-manager").children().addClass('admin-hidden')
			$("#msc-admin-"+id).removeClass('admin-hidden')
		},
		
		showGalleries: function(section)
		{
			admsc.section = section
			admsc.gallery = new Object()
			window.location.hash = '#galleries'
			return false
		},
		
		// load an image in the viewer
		setImage: function(image)
		{
			admsc.image = image
			admsc.viewer = true
			//window.location.hash = '#galleries/'+admsc.gallery.folder+'/'+image
			return false
		},
		
		// clear an image from the viewer
		clearImage: function()
		{
			admsc.image = new Object()
			admsc.viewer = false
			return false
		},
		
		getImages: function()
		{
			admsc.thumb_message.status = {"filepath":"","type":"info","message":"Getting a list of images to process..."}
			
			$.getJSON('../lib/php/gateway.php?do=get_images', function(output)
			{
				admsc.thumb_images = output
			})
			.done(function()
			{
				admsc.thumb_message.status = {"filepath":"","type":"info","message":"Start processing images..."}
				admsc.createThumb()
			})
			.fail(function()
			{
				admsc.thumb_images = new Object()
				admsc.thumb_message.status = {"filepath":"","type":"danger","message":"Error getting an image list to process. Please try again"}
			})
			.always(function() {})
		},
		
		createThumb: function(imgpath)
		{
			if(admsc.thumb_images.length > 0)
			{
				console.log('start image')
			
				//setTimeout(function(){
					
					admsc.thumb_image = admsc.thumb_images.pop()
					
					if (admsc.thumb_image.format == 'image')
					{
						console.log('before getJSON')
						admsc.thumb_message.status = {"filepath":admsc.thumb_image.filepath,"type":"info","message":"Starting image processing... "}
						
						$.getJSON('../lib/php/gateway.php?do=create_thumb&id='+encodeURIComponent(admsc.thumb_image.filepath), function(output)
						{
							console.log('start getJSON')
							admsc.thumb_message.status = {"filepath":"","type":"info","message":"Creating thumbnail..."}
						})
						.done(function(output)
						{
							console.log('done')
							admsc.thumb_message.status = output
							admsc.createThumb()
						})
						.fail(function(output)
						{
							console.log('fail')
							admsc.thumb_message.status = output
	/*
							if (output.responseText.indexOf('{')!=-1) {
								responses = output.responseText.split('{')
								admsc.thumb_message.response = output
								admsc.thumb_message.status = JSON.parse('{'+responses[1])
							} else {
								admsc.thumb_message.status = output
							}
	*/
							//admsc.createThumb()
						})
						.always(function()
						{
							console.log('finished image')
						})
					} else
					{
						admsc.createThumb()
						console.log('not an image')
					}
					
				//},500)
			
			} else
			{
				admsc.thumb_message.status = {"filepath":"","type":"success","message":"Finished creating thumbnails. Woohoo!"}
				admsc.thumb_message.response = {}
				admsc.thumb_image = new Object()
				admsc.thumb_images = new Object()
				console.log('finished all images')
			}
		}
		
/*
		showGalleryAdmin: function()
		{
			
		}
*/
	
	}

});


//// DOCUMENT READY ////


$(document).ready(function()
{
	//login()
});

function login()
{
	// loginForm is submitted
	$("form#loginForm").submit(function()
	{
		// get username
		var username = $('#username').attr('value');
		// get password
		var password = $('#password').attr('value');
		
		// values are not empty
		if (username && password) {
			$.ajax({
				type: "GET",
				url: "/cgi-bin/login.pl",
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				// send username and password as parameters to the Perl script
				data: "username=" + username + "&password=" + password,
				// error: script call was *not* successful
				error: function(XMLHttpRequest, textStatus, errorThrown) { 
					$('div#loginResult').text("responseText: " + XMLHttpRequest.responseText 
						+ ", textStatus: " + textStatus 
						+ ", errorThrown: " + errorThrown);
					$('div#loginResult').addClass("error");
				}, 
				// success: script call was successful 
				success: function(data)
				{
					// script returned error
					if (data.error) {
						$('div#loginResult').text("data.error: " + data.error);
						$('div#loginResult').addClass("error");
					}
					// login was successful
					else {
						$('form#loginForm').hide();
						$('div#loginResult').text("data.success: " + data.success 
							+ ", data.userid: " + data.userid);
						$('div#loginResult').addClass("success");
					}
				}
			});
		}
		else {
			$('div#loginResult').text("enter username and password");
			$('div#loginResult').addClass("error");
		} // else
		$('div#loginResult').fadeIn();
		return false;
	});
}


//// functions

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

