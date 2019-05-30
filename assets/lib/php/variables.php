<?php

	error_reporting(E_ERROR | E_WARNING | E_PARSE);
	
	date_default_timezone_set('America/Los_Angeles');
	
	//// settings //////////////////
	
	$settings = array();
	$settings['image_prefix'] = 'img_';
	$settings['gallery_prefix'] = '';
	$settings['thumbnail_prefix'] = 'th_';
	$settings['preview_thumbnail_quality'] = '80';
	$settings['thumbnail_quality'] = '80';
	$settings['image_quality'] = '80';
	$settings['cache_folder'] = 'cache';
	$settings['thumb_sizes'] = array('512','256','128');

	//// variables /////////////////
	
	$base_password = "venezuela";
	
	$basepath = dirname(dirname(dirname(__FILE__)));
	
	$thumbnail_max_size = 128;
	
	$cache_prefix = "th_";
	
	$image_types = array(
		0=>'UNKNOWN',
		1=>'GIF',
		2=>'JPEG',
		3=>'PNG',
		4=>'SWF',
		5=>'PSD',
		6=>'BMP',
		7=>'TIFF_II',
		8=>'TIFF_MM',
		9=>'JPC',
		10=>'JP2',
		11=>'JPX',
		12=>'JB2',
		13=>'SWC',
		14=>'IFF',
		15=>'WBMP',
		16=>'XBM',
		17=>'ICO',
		18=>'COUNT' 
	);
	
	$img_types = [
		"",
		"GIF",
		"JPG",
		"JPEG",
		"PNG",
		"SWF",
		"PSD",
		"BMP",
		"TIFF",
		"TIFF",
		"JPC",
		"JP2",
		"JPX",
		"JB2",
		"SWC",
		"IFF",
		"WBMP",
		"XBM"
	];
	
	$video_types = array(
		'MP4',
		'OGG',
		'WEBM'
	);

?>
