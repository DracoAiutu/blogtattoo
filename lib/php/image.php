<?php
	
	//error_reporting(E_ALL);

 /**
  * THUMBS DISPLAY
  */

	//// import init file ////
	//require_once("general-bootstrap.php");
	
	// fake settings //
	$settings['set_double_encoding'] = false;
	$settings['image_prefix'] = "img_";
	$settings['gallery_prefix'] = "";
	$settings['thumbnail_prefix'] = "th_";
	$settings['preview_thumbnail_quality'] = "80";
	$settings['thumbnail_quality'] = "80";
	$settings['image_quality'] = "80";
	$settings['cache_folder'] = "cache/";
	
	//error_reporting(E_ALL);
	
	//// debug mode
	$th_debug_flag = false;//$settings['thumbnail_debug'];
	
	$error_msg = '';
	$center_image = true;
	
	$img_types = array(
		"",
		"GIF",
		"JPG",
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
	);
	
	// debug
	//$th_debug = (isset($settings['thumbnail_debug']))
	//	? $settings['thumbnail_debug']
	//	: false;
	
	//// receives the original image as [?img=relative/path/to/image.jpg] ////
	// get image path
	$img = false;
	if (isset($_GET["img"]))
		$img = "./".str_replace("\\","", html_entity_decode(htmlentities($_GET["img"], ENT_QUOTES)));
	
	// check if thumbnail
	$th = (isset($_GET["th"]))
		? true
		: false;
	
	$_prefix = ($th)
		? $settings['thumbnail_prefix']
		: $settings['image_prefix'];
	
	// image is square?
	$sq = (isset($_GET["sq"]))
		? htmlentities($_GET["sq"], ENT_QUOTES)
		: false;
	
	// image max size
	$max = (isset($_GET["max"])) 
		? htmlentities($_GET["max"], ENT_QUOTES) 
		: ($th) 
			? 128
			: 1280;
	
	// image quality
	$qual = (isset($_GET["q"]))
		? htmlentities($_GET["q"], ENT_QUOTES)
		: $settings['thumbnail_quality'];
	
	// cache thumbnail
	$cache_thumb = (isset($_GET["c"]))
		? true
		: false;
	$cache_thumb = true;
	
	// delete existing thumbnail
	$unlink = (isset($_GET["u"]))
		? true
		: false;
	
	
	/// now create the thumbnail
	if ($th===true) create_thumbnail($img, true, $th, $sq, $max);


//// CREATE THUMBNAIL FUNCTION ////	

function create_thumbnail($img, $disp=false, $th=1, $sq=0, $max=256)
{
	
	global $settings;
	global $unlink;
	global $_prefix;
	global $th_debug_flag;
	global $img_types;
	
	$error_msg = '';
	$center_image = true;
	$cache_thumb = $th;
	
	$thumb = '';	
	$image = '';
	
	//// vars for cache images names and directories (if enabled)
	$dir_img = dirname($img);
	$curr_img = explode("/", $dir_img);
	$current_gallery = array_pop($curr_img);
	$cache_thumb_dir = $settings['cache_folder']
		.$settings['gallery_prefix']
		.$current_gallery;
	$thumb_url = $cache_thumb_dir."/"
		.$_prefix
		//."_".$max."px_"
		.basename($img);
	
	//// if cached image exists, just output cached image	
	if (file_exists($thumb_url)) {
		
		//// better to kill it from now
		//die("Cached image [".$thumb_url."] already exists");
		
		//// here we just spit the file back
		$thumb_size = getimagesize($thumb_url);
		$thumb_info = $img_types[$thumb_size[2]];
		
		//// return image ////
		if (($thumb_info == "JPG") && (imagetypes() & IMG_JPG)) {
			$header_type = "jpeg";
			
		} else if (($thumb_info == "GIF") && (imagetypes() & IMG_GIF)) {
			$header_type = "gif";
			
		} else if (($thumb_info == "PNG") && (imagetypes() & IMG_PNG)) {
			$header_type = "png";
		}
		
		//// output image
		header("Content-type: image/".$header_type);
		readfile($thumb_url);
		return;
	}
	
	//// process image
	if ($img && file_exists($img)) {
		
		//// get image size ////
		$img_info = getimagesize($img);
		
		if ($img_info) {
			
			//// resize image ////
			$img_type = $img_types[$img_info[2]];
			$th_w = $img_info[0];
			$th_h = $img_info[1];
			$move_w = $move_h = 0;
			$w = $h = 0;
			
			if ($th_w >= $th_h) {
				
				//// Landscape Picture ////
				if ($sq) {
					$h = $max;
					$w = (($th_w * $h) / $th_h);
					$move_w = (($th_w - $th_h) / 2);
					$w = $max;
					$th_w = $th_h;
				} else {
					$w = $max;
					$h = (($th_h * $w) / $th_w);
				}
				
			} else {
				
				//// Portrait Picture ////
				if ($sq) {
					$w = $max;
					$h = (($th_h * $w) / $th_w);
					$move_h = (($th_h - $th_w) / 2);
					$h = $max;
					$th_h = $th_w;
				} else {
					$h = $max;
					$w = (($th_w * $h) / $th_h);
				}
			}
			
			//// create image ////
			$thumb = imagecreatetruecolor($w, $h);
			imagefill($thumb, 255, 255, 255);
			
			//// copy image ////
			if (($img_type == "JPG") && (imagetypes() & IMG_JPG)) {
				$image = imagecreatefromjpeg($img);
				
			} else if (($img_type == "GIF") && (imagetypes() & IMG_GIF)) {
				$image = imagecreatefromgif($img);
				
			} else if (($img_type == "PNG") && (imagetypes() & IMG_PNG)) {
				$image = imagecreatefrompng($img);
				
			}
		} else {
			$error_msg = "!! BAD IMG";
		}
	}
	
	//// if there's an error reading the original image
	//// output an error image
	// see if it failed
	if (!$th_debug_flag && (!$image | $image=='' | $error_msg!='')) {
		
		// do not cache
		$cache_thumb = '';
		$error_size = $max;
		// create a white image
		$thumb  = imagecreatetruecolor($error_size, $error_size);
		$lightgrey = imagecolorallocate($thumb, 234, 234, 234);
		$grey = imagecolorallocate($thumb, 66, 66, 66);
		$black  = imagecolorallocate($thumb, 0, 0, 0);
		$white  = imagecolorallocate($thumb, 255, 255, 255);
		$orange  = imagecolorallocate($thumb, 255, 66, 0);
		$bg_color = $grey;
		$fg_color = $white;
		imagefilledrectangle($thumb, 0, 0, $error_size, $error_size, $bg_color);
			
		// output an errmsg
		$fnum = ($max >= 70) ? 2 : 1;
		$msg_height = 12;
		$msg_array = explode(":",$error_msg);
		for ($i=0; $i<count($msg_array); $i++) {
			imagestring($thumb, $fnum, 2, 2+($msg_height*$i), $msg_array[$i], $fg_color);
		}
	
		/// up the image quality
		$qual = 100;
		
	} else {
		$created = imagecopyresampled($thumb, $image, 0, 0, $move_w, $move_h, $w, $h, $th_w, $th_h);
	}
	
	// if we're requesting to delete the cached image
	if ($unlink) $delete = @unlink($thumb_url);
	
	// if we're allowed to cache images
	if ($cache_thumb) {
		
		// if no cache directory, create it 
		if (!is_dir($settings['cache_folder'])) mkdir($settings['cache_folder']);
		
		// if no gallery cache directory, create it 
		if (!is_dir($cache_thumb_dir)) mkdir($cache_thumb_dir);
		
		// if permissions of cache folder are wrong, correct them
		if ((fileperms($cache_thumb_dir)&0777)!==0755) @chmod($cache_thumb_dir, 0755);
		
		// create cached thumb
		if (!file_exists($thumb_url)) $thumbCreated = imagejpeg($thumb, $thumb_url, $qual);
	}
	
	if ($disp) {
		//// display created image ////
		header("Content-type: image/jpeg");
		imagejpeg($thumb, NULL, $qual);
	}
	
	//// destroy images (free memory)
	imagedestroy($image);
	imagedestroy($thumb);
}
	/* END */
?>