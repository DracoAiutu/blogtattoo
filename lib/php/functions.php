<?php


	include_once('variables.php');
	include_once('getid3.php');

	////// LOG IN //////////////////////////

	function check_password_file()
	{
		global $basepath;

		$password_file = $basepath.'/admin/.password';
		$log_file = $basepath.'/admin/.log';

		$logged['file'] = false;
		$logged['in'] = false;

		# password exists
		if (file_exists($password_file))
		{
			$logged['file'] = true;

			# logged in last hour
			if (filemtime($password_file) >= strtotime("1 hour ago"))
			{
				$logged['in'] = true;
			}
		}

		# log process
		$log = _log('check_password_file');

		return $logged;
	}

	function log_in()
	{
		global $basepath;

		$username = false;
		$password = false;

		$logged['file'] = false;
		$logged['in'] = false;

		$password_file = $basepath.'/admin/.password';
		$log_file = $basepath.'/admin/.log';

		if (file_exists($password_file))
		{
			$logged['file'] = true;

			# logged in last hour
			if (filemtime($password_file) >= strtotime("1 hour ago"))
			{
				$logged['in'] = true;
			}
		}

		# read sent password
		if (isset($_POST["password"])) $password = $_POST["password"];
		if (isset($_GET["password"])) $password = $_GET["password"];

		# sha1 saved_password
		$sha_password = sha1($password);

		# read saved_password from file
		$saved_password = file_get_contents($password_file);

		#compare to password
		$logged['in'] = ($saved_password === $sha_password) ? true : false;

		if ($logged['in'])
			$saved_password = file_put_contents($password_file, $saved_password);

		# log
		$log = _log('log_in',$logged['in']);

		# return {file,log,in}
		return $logged;
	}

	function save_password()
	{
		global $basepath;

		$username = false;
		$password = false;

		$logged['file'] = false;
		$logged['in'] = false;

		# read the GET params
		#if (isset($_POST["username"])) $username = $_POST["username"];
		if (isset($_POST["password"])) $password = $_POST["password"];
		if (isset($_GET["password"])) $password = $_GET["password"];

		# sha1 saved_password
		$sha_password = sha1($password);

		# read password from file
		$saved_password = file_put_contents($basepath."/admin/.password", $sha_password);

		# saved password?
		$logged['file'] = ($saved_password) ? true : false;

		# log
		$log = _log('save_password',$logged['file']);

		# return JSON string
		return $logged;
	}

	function _log($action='log',$flag=true)
	{
		global $basepath;

		$status = ($flag) ? 'success' : 'issue';

		$log_data = array('action'=>$action, 'status'=>$status, 'timestamp'=>date('c'), 'ip'=>$_SERVER['REMOTE_ADDR']);
		$log = file_put_contents($basepath."/admin/.log", json_encode($log_data)."\n", FILE_APPEND);

		return $log;
	}

	////// GET GALLERIES //////////////////////


	function get_menu()
	{
		global $basepath;
		global $video_types;

		$output = array();
		$galleries = array();

		// open directory and parse file list
		if ($dh = opendir("$basepath/galleries")) {

			// iterate over file list & print filenames
			while (($filename = readdir($dh)) !== false) {

				if ((strpos($filename,".") !== 0)
					&& (strpos($filename,"_") !== 0)
					&& (!is_file("$basepath/galleries/$filename")))
				{
					$galleries[] = $filename;
				}
			}
			// close directory
			closedir($dh);
		}

		else {

			$output[] = null;
			return 'NULL';

		}

		if ($galleries)
		{
			$n = 0;

			foreach ($galleries as $key => $filename) {

				$filepath = $basepath.'/galleries/'.$filename;

				$output[$n]['id'] = strtolower(str_replace(" ","_",$filename));
				$output[$n]['folder'] = str_replace(" ","_",$filename);
				$output[$n]['name'] = clean_name($filename);//$filename;
				$output[$n]['photos'] = count(check_images($filepath));
				$photos = check_images($filepath);
				$output[$n]['poster'] = $photos[array_search("jpg",array_column($photos,"extension"))];

				$output[$n]['order_id'] = preg_replace('/^([0-9]*)(_|-)/','',$filename);
				$output[$n]['order_name'] = clean_name($output[$n]['order_id']);

				$n++;
			}

		}

		else
		{
			$output[] = null;

		}

		// don't sort
		//$out = $output;

		// sort output
		$out = array_orderby($output, 'id', SORT_NUMERIC);

		return $out;
	}

	//// GET GALLERY ////////

	function get_gallery($id)
	{
		global $basepath;

		$filepath = "$basepath/galleries/$id";

		$output = array();

		$output['id'] = strtolower(str_replace(" ","_",$id));
		$output['name'] = clean_name($id);
		$output['photos'] = check_images($filepath);

		return $output;
	}

	function get_gallery_info($id)
	{
		global $basepath;

		$filepath = "$basepath/galleries/".rawurlencode($id);

		//$output = array();

		$output['id'] = strtolower(str_replace(" ","_",$id));
		$output['name'] = clean_name($id);
		$output['folder'] = $id;

		return $output;
	}

	function get_gallery_photos($id)
	{
		global $basepath;

		$filepath = "$basepath/galleries/$id";

		$output = check_images($filepath);

		return $output;
	}

	function cache_thumbnails()
	{
		global $basepath;

		$output = array();
		$galleries = array();
		$photos = array();

		// open directory and parse file list
		if ($dh = opendir("$basepath/galleries"))
		{
			// iterate over file list & print filenames
			while (($filename = readdir($dh)) !== false)
			{
				if ((strpos($filename,".") !== 0)
					&& (strpos($filename,"_") !== 0)
					&& (!is_file("$basepath/galleries/$filename"))
					) {
						$galleries[] = $filename;
				}
			}
			// close directory
			closedir($dh);
		}

		if ($galleries)
		{
			foreach ($galleries as $key => $filename)
			{
				$filepath = "$basepath/galleries/$filename";
				$photos[$key] = check_images($filepath, true);
			}
		}

		return $photos;
	}

	function check_images($path)
	{
		global $basepath;
		global $cache_prefix;
		global $image_types;
		global $settings;

		$thumb_sizes = $settings['thumb_sizes'];

		if (!is_dir($path)) return $basepath;

		$list = array();

		$directory = @opendir($path);

		while ($file = @readdir($directory))
		{
			if (($file != ".") && ($file != ".."))
			{
				$filepath = $path."/".$file;

				//replace double slashes
				$filepath = preg_replace('/(\/){2,}/','/',$filepath);

				$path_info = pathinfo($filepath);

				if(is_file($filepath)
					&& (strpos($file,".") !== 0)
					&& (strpos($file,"_") !== 0)
					&& (strpos($file,"--") !== 0))
				{
					$gallery_name = array_pop(explode("/",$path_info['dirname']));

					if ((strpos($gallery_name,".") !== 0)
						&& (strpos($gallery_name,"_") !== 0)
						&& (strpos($gallery_name,"--") !== 0))
					{
						//$filepath = "galleries/".$gallery_name."/".$path_info['basename'];
						$filepath = "galleries/".rawurlencode($gallery_name)."/".rawurlencode($path_info['basename']);

						$list_item['gateway_path'] = "../../".$filepath;
						//$list_item['filepath'] = $filepath;
						$list_item['filepath'] = $filepath;
						$list_item['dummy'] = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
						$list_item['gallery'] = $gallery_name;
						$list_item['gallery_encoded'] = rawurlencode($gallery_name);
						$list_item['dirname'] = $path_info['dirname'];
						$list_item['dirpath'] = $path_info['dirname'].'/'.$path_info['basename'];
						$list_item['basepath'] = $basepath;
						$list_item['basename'] = rawurlencode($path_info['basename']);
						$list_item['extension'] = $path_info['extension'];
						$list_item['filename'] = rawurlencode($path_info['filename']);
						$list_item['name'] = clean_name($path_info['filename']);
						$list_item['file'] = $file;
						$list_item['file_encoded'] = rawurlencode($file);
						$list_item['thumbpath'] = 'lib/php/image.php?max=512&img='.$filepath;
						$list_item['thumbpath_background'] = 'lib/php/image.php?max=512&img='.$filepath;

						// make thumbs for each thumb size
						foreach($thumb_sizes as $size)
						{
							$thumb_relfile = rawurlencode('th_'.$size.'px_'.$file);
							//$thumb_relpath = 'cache/'.$gallery_name.'/'.$thumb_relfile;
							$thumb_relpath = 'cache/'.rawurlencode($gallery_name).'/'. rawurlencode($thumb_relfile);
							//$image_relpath = 'galleries/'.$gallery_name.'/'.$file;
							$image_relpath = 'galleries/'.rawurlencode($gallery_name).'/'.rawurlencode($file);
							$__p = $basepath.'/';
							$list_item['thumb'.$size.'_path'] = $__p.$thumb_relpath;
							if (file_exists($__p.$thumb_relpath)) {
								$list_item['thumb'.$size] = $thumb_relfile;
								$list_item['thumbpath'.$size] = $thumb_relpath;
								$list_item['thumbpath'.$size.'_background'] = $thumb_relpath;
								// substitute default thumbs if 512px
								if ($size=='512') {
									$list_item['thumbpath'] = $thumb_relpath;
									$list_item['thumbpath_background'] = $thumb_relpath;
								}
							}/* else {
								//create_thumbnail($image_relfile);
								$list_item["thumb$size"] = false;
								$list_item['thumb'.$size.'_encoded'] = false;
							}*/
						}

						// videos
						if ($list_item['extension']=='mp4')
						{
							$list_item['format'] = 'video';
							$getID3 = new getID3;
							$_s = $getID3->analyze($list_item['gateway_path']);
							$list_item['size'] = $_s['filesize'];
							$list_item['img_w'] = $_s['video']['resolution_x'];
							$list_item['img_h'] = $_s['video']['resolution_y'];
							$list_item['duration'] = $_s['playtime_string'];

						// images
						} else {
							$list_item['format'] = 'image';
							$_s = @getimagesize($list_item['gateway_path']);
							$list_item['size'] = $_s;
							$list_item['img_w'] = $_s[0];
							$list_item['img_h'] = $_s[1];
							$list_item['type'] = $image_types[$_s[2]];
						}

						$list[] = $list_item;
					}
				}
			}

		}

		@closedir($directory);

		$sorted = sort($list, SORT_REGULAR);

		return $list;
	}

	function save_settings($settings)
	{
		global $basepath;

		if ($settings=='') return ['type'=>'warning','title'=>'No settings saved','content'=>'It seems no settings were passed to be saved. Please try again.'];

		$status = [];
		$timestamp = date('YmdHis');

		$settings_filepath = $basepath.'/config/';
		$settings_backup_path = $settings_filepath.'backups/';
		$settings_filename = 'settings';
		$settings_extension = '.json';
		$settings_file = $settings_filepath.$settings_filename.$settings_extension;
		$settings_default_file = $settings_filepath.$settings_filename.'-default'.$settings_extension;
		$settings_backup = $settings_backup_path.'settings-'.$timestamp.$settings_extension;

		if (is_file($settings_file)) {
			// save backup of current
			$current = file_get_contents($settings_file);
			$backup = file_put_contents($settings_backup, $current);
		} else if(is_file($settings_default_file)) {
			$backup = file_put_contents($settings_backup, $settings_default_file);
		}

		// save new settings
		$new_settings = file_put_contents($settings_file, $settings);

		if ($new_settings!==false) {
			// success saving settings
			$status = ["type"=>"success","title"=>"Success!","content"=>"Settings successfully saved"];
			// delete backup
			unlink($settings_backup);

		} else {
			// failure
			if (!is_file($settings_file)) {
				// reverting backup
				$current = file_get_contents($settings_backup);
				$old_settings = file_put_contents($settings_file, $current);
				// error saving settings
				$status = ['type'=>'danger','title'=>'Caution!','content'=>'There was an error saving settings. Please try again'];
			}
		}

		//// return
		//echo $status;
		return $status;
	}

	function create_thumbnail($img)
	{
		global $basepath;
		global $settings;

		$rel_path = '../../';

		$th_debug_flag = false;

		$img_types = [
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
		];

		$error_msg = array();
		$files = array();
		$output = array();
		$center_image = true;
		$cache_thumb = true;

		$cache_folder = $settings['cache_folder'];
		$cache_path = $rel_path.$settings['cache_folder'];
		$gallery_prefix = $settings['gallery_prefix'];
		$thumbnail_prefix = $settings['thumbnail_prefix'];
		$thumb_sizes = $settings['thumb_sizes'];
		$thumbnail_quality = $settings['thumbnail_quality'];
		$thumb_sizes = array('256','128');

		$thumb = '';
		$image = '';
		$thumb_url = '';

		$img_path = "$basepath/$img";
		$img_rel_path = "../../$img";

		//// process image
		if ($img_path && file_exists($img_path))
		{
			//// vars for cache images names and directories (if enabled)
			$dir_img = dirname($img_path);
			$curr_img = explode("/", $dir_img);
			$current_gallery = array_pop($curr_img);
			$cache_thumb_dir = $rel_path.$cache_folder.'/'.$gallery_prefix.$current_gallery;

			foreach ($thumb_sizes as $size)
			{
				$thumb_url = $cache_thumb_dir.'/'.$thumbnail_prefix.$size.'px_'.basename($img);

				//// if cached image exists, just output cached image
				if (!file_exists($thumb_url))
				{
					$path_info = pathinfo($img);

					if (in_array(strtoupper($path_info['extension']), $img_types))
					{
						//// get image size ////
						$img_info = @getimagesize($img);

						if (is_array($img_info)) {

							//// resize image ////
							$img_type = $img_types[$img_info[2]];
							$thumb_width = $img_info[0];
							$thumb_height = $img_info[1];
							$move_w = $move_h = 0;
							$w = $h = 0;

							if ($thumb_width >= $thumb_height) {
								//// Landscape Picture ////
								$w = $size;
								$h = (($thumb_height * $w) / $thumb_width);
							} else {
								//// Portrait Picture ////
								$h = $size;
								$w = (($thumb_width * $h) / $th_h);
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

							} else {
								//$error_msg[] = "UNPROCESSABLE IMAGE";
							}
						} else {
							//$error_msg[] = "NO IMAGE INFO";
						}

						//// if there's an error reading the original image
						//// output an error image
						// see if it failed
						if ($image) {

							// resample image
							$created = imagecopyresampled($thumb, $image, 0, 0, $move_w, $move_h, $w, $h, $thumb_width, $thumb_height);

							if ($created) {
								// if no cache directory, create it
								if (!is_dir($cache_path)) mkdir($cache_path);

								// if no gallery cache directory, create it
								if (!is_dir($cache_thumb_dir)) mkdir($cache_thumb_dir);

								// if permissions of cache folder are wrong, correct them
								if ((fileperms($cache_thumb_dir)&0777)!==0755) @chmod($cache_thumb_dir, 0755);

								// create cached thumb
								if (!file_exists($thumb_url)) {
									$thumb_created = imagejpeg($thumb, $thumb_url, $thumbnail_quality);
									//$error_msg[] = $thumb_url;
								}
							} else {
								//$error_msg[] = "RESIZED THUMB CREATION ERROR";
							}

							//// destroy images (free memory)
							imagedestroy($image);
							imagedestroy($thumb);

						} else {
							//$error_msg[] = "IMAGE ERROR";
						}

						// if we're requesting to delete the cached image
						//if ($unlink) $delete = @unlink($thumb_url);

					} else {
						// it's not an image
					}

				} else {
					// thumb exists
					//$error_msg[] = "THUMB EXISTS";
				}

				// debug
				if (false) {
					if (!empty($error_msg)) {
						echo(implode(' / ',$error_msg).'<br>');
					}
					if ($image) {
						echo('image: '.$image.'<br>');
					}
					if ($thumb_url) {
						echo('thumb_url: '.$thumb_url.'<br>');
					}
					echo('<hr>');
				}

				//array_push($output, $error_msg);

				//$error_msg = array();
			}
		}
	}

	/* admin thumbnail functions */



	function check_all_images($echo=false)
	{
		$path = '../../galleries';

		global $basepath;
		global $image_types;
		global $settings;

		$cache_prefix = $settings['cache_prefix'];
		$thumb_sizes = $settings['thumb_sizes'];

		if (!is_dir($path)) return $basepath;

		$list = array();

		$directory = @opendir($path);

		while ($file = @readdir($directory))
		{
			if (($file != ".") && ($file != ".."))
			{
				$filepath = $path."/".$file;

				//replace double slashes
				$filepath = preg_replace('/(\/){2,}/','/',$filepath);

				$path_info = pathinfo($filepath);

				if (is_file($filepath)
					&& ($file !== 'index.php')
					&& (strpos($file,".") !== 0)
					&& (strpos($file,"_") !== 0)
					&& (strpos($file,"--") !== 0))
				{
					$gallery_name = array_pop(explode("/",$path_info['dirname']));

					if ((strpos($gallery_name,".") !== 0)
						&& (strpos($gallery_name,"_") !== 0)
						&& (strpos($gallery_name,"--") !== 0))
					{
						$filepath = "galleries/".$gallery_name."/".$path_info['basename'];

						$list_item['gateway_path'] = "../../".$filepath;
						$list_item['filepath'] = $filepath;
						$list_item['gallery'] = $gallery_name;
						$list_item['dirname'] = $path_info['dirname'];
						$list_item['basename'] = $path_info['basename'];
						$list_item['extension'] = $path_info['extension'];
						$list_item['filename'] = $path_info['filename'];
						$list_item['name'] = clean_name($path_info['filename']);
						$list_item['file'] = $file;
						foreach($thumb_sizes as $size) {
							$thumb_relfile = 'cache/'.$gallery_name.'/'.$cache_prefix.$size.'px_'.$file;
							$image_relfile = 'galleries/'.$gallery_name.'/'.$file;
							if (file_exists('../../'.$thumb_relfile)) {
								$list_item["thumb$size"] = $cache_prefix.$size.'px_'.$file;
							} else {
								$list_item["thumb$size"] = false;
							}
						}

						// videos
						if ($list_item['extension']=='mp4') {
							$list_item['format'] = 'video';
							$getID3 = new getID3;
							$_s = $getID3->analyze($list_item['gateway_path']);
							$list_item['size'] = $_s['filesize'];
							$list_item['img_w'] = $_s['video']['resolution_x'];
							$list_item['img_h'] = $_s['video']['resolution_y'];
							$list_item['duration'] = $_s['playtime_string'];

						// images
						} else {
							$list_item['format'] = 'image';
							$_s = @getimagesize($list_item['gateway_path']);
							$list_item['size'] = $_s;
							$list_item['img_w'] = $_s[0];
							$list_item['img_h'] = $_s[1];
							$list_item['type'] = $image_types[$_s[2]];
						}

						$list[] = $list_item;
					}

				} else if (is_dir($filepath))
				{
					$new_list = check_images($filepath);
					$old_list = $list;
					$list = array_merge($old_list, $new_list);
				}
			}

		}

		@closedir($directory);

		$sorted = sort($list, SORT_REGULAR);

		if ($echo) {
			foreach($list as $image) {
				echo create_thumb($image['filepath'], true).'<br><br>';
			}
		} else {
			return $list;
		}
	}

	function create_thumb($filepath, $echo=false)
	{
		global $basepath;
		global $settings;
		global $img_types;
		global $image_types;

		$image_prefix = $settings['image_prefix'];
		$gallery_prefix = $settings['gallery_prefix'];
		$cache_prefix = $settings['thumbnail_prefix'];
		$preview_thumbnail_quality = $settings['preview_thumbnail_quality'];
		$thumbnail_quality = $settings['thumbnail_quality'];
		$image_quality = $settings['image_quality'];
		$cache_folder = $settings['cache_folder'];
		$thumb_sizes = $settings['thumb_sizes'];

		$galleries_rel_path = '../../';

		$output = array();
		$galleries = array();
		$photos = array();
		$list = array();

		$path = "$basepath/galleries/$filename";

		$path_info = pathinfo($filepath);
		$dirname = $path_info['dirname'];
		$basename = $path_info['basename'];
		$dirname_array = explode("/",$dirname);
		$gallery_name = array_pop($dirname_array);
		$file = $basename;

		if(is_file($galleries_rel_path.$filepath))
		{

			//$filepath = "galleries/".$gallery_name."/".$basename;

			foreach($thumb_sizes as $size) {
				$thumb_relfile = 'cache/'.$gallery_name.'/'.$cache_prefix.$size.'px_'.$file;
				$image_relfile = 'galleries/'.$gallery_name.'/'.$file;
				if (!file_exists($galleries_rel_path.$thumb_relfile)) {
					//create_thumbnail($image_relfile);

					$center_image = true;
					$cache_thumb = true;

					$thumb = '';
					$image = '';
					$thumb_url = '';

					$img = $image_relfile;

					$img_path = "$basepath/$img";
					$img_rel_path = $galleries_rel_path.$img;

					//// process image
					if ($img_path && file_exists($img_path))
					{
						//// vars for cache images names and directories (if enabled)
						$dir_img = dirname($img_path);
						$curr_img = explode("/", $dir_img);
						$current_gallery = array_pop($curr_img);
						$cache_dir = $galleries_rel_path.$cache_folder.'/'.$gallery_prefix.$current_gallery;

						foreach ($thumb_sizes as $size)
						{
							$thumb_url = $cache_dir.'/'.$cache_prefix.$size.'px_'.basename($img);

							//// if cached image exists, just output cached image
							if (!file_exists($thumb_url))
							{
								$path_info = pathinfo($img);

								if (in_array(strtoupper($path_info['extension']), $img_types))
								{
									//// get image size ////
									$img_info = @getimagesize($galleries_rel_path.$img);

									if (is_array($img_info))
									{
										//// resize image ////
										$img_type = $image_types[$img_info[2]];
										$thumb_width = $img_info[0];
										$thumb_height = $img_info[1];
										$move_w = $move_h = 0;
										$w = $h = 0;

										if ($thumb_width >= $thumb_height) {
											//// Landscape Picture ////
											$w = $size;
											$h = (($thumb_height * $w) / $thumb_width);
										} else {
											//// Portrait Picture ////
											$h = $size;
											$w = (($thumb_width * $h) / $thumb_height);
										}

										//// create image ////
										$thumb = imagecreatetruecolor($w, $h);
										imagefill($thumb, 255, 255, 255);

										//// copy image ////
										if (($img_type == "JPEG") && (imagetypes() & IMG_JPG)) {
											$image = imagecreatefromjpeg($galleries_rel_path.$img);

										} else if (($img_type == "GIF") && (imagetypes() & IMG_GIF)) {
											$image = imagecreatefromgif($galleries_rel_path.$img);

										} else if (($img_type == "PNG") && (imagetypes() & IMG_PNG)) {
											$image = imagecreatefrompng($galleries_rel_path.$img);

										} else return array("filepath"=>"'.$filepath.'","type"=>"warning","message"=>"Not a GIF/JPG/PNG");

									} else return array("filepath"=>"'.$filepath.'","type"=>"danger","message"=>"Could not get image info");

									if ($image) {

										// resample image
										$created = imagecopyresampled($thumb, $image, 0, 0, $move_w, $move_h, $w, $h, $thumb_width, $thumb_height);

										if ($created) {

											// if no gallery cache directory, create it
											if (!is_dir($cache_dir)) mkdir($cache_dir);

											// if permissions of cache folder are wrong, correct them
											if ((fileperms($cache_dir)&0777)!==0755) @chmod($cache_dir, 0755);

											// create cached thumb
											$thumb_created = imagejpeg($thumb, $thumb_url, $thumbnail_quality);

											if ($echo) {
												return basename($img).' / '.$filepath;
											} else {
												if ($thumb_created) return array("filepath"=>"'.$filepath.'","type"=>"success","message"=>"Thumbnails created successfully");
											}

											//// destroy images (free memory)
											imagedestroy($image);
											imagedestroy($thumb);

										} else return array("filepath"=>"'.$filepath.'","type"=>"danger","message"=>"Could not create image");

									} else return array("filepath"=>"'.$filepath.'","type"=>"danger","message"=>"Could not process image");

								} else return array("filepath"=>"'.$filepath.'","type"=>"warning","message"=>"Not an image, (probably a video)");

							} else return array("filepath"=>"'.$filepath.'","type"=>"info","message"=>"Thumb already exists");
						}
					}
				}
			}
		}
	}

	## HELPER FUNCTIONS ##############

	function array_orderby()
	{
	    $args = func_get_args();
	    $data = array_shift($args);
	    foreach ($args as $n => $field) {
	        if (is_string($field)) {
	            $tmp = array();
	            foreach ($data as $key => $row)
	                $tmp[$key] = $row[$field];
	            $args[$n] = $tmp;
	            }
	    }
	    $args[] = &$data;
	    call_user_func_array('array_multisort', $args);
	    return array_pop($args);
	}

	function get_image_binary($image)
	{
	    return base64_encode(file_get_contents($image));
	}

	function clean_name($name)
	{
		
		// hide numbers if in front
		$name = preg_replace('/^[0-9]*[\-|\_]/i',"",$name); // both hyphened and underscored num prefixes
		
		//replace dashes for spaced dashes 
		$name = str_replace("-"," - ",$name);
		
		// replace underscores for spaces
		$name = str_replace("_"," ",$name);

		return $name;
	}

	function spaces($str) {
		//$out = preg_replace(" ", "%20", $str);
		//return $out;
	    $revert = array("%21"=>"!", "%2A"=>"*", "%27"=>"'", "%28"=>"(", "%29"=>")");
	    return strtr(rawurlencode($str), $revert);
	}

?>
