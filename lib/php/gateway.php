<?php

//// includes
include_once('functions.php');

//// GET vars
$get = '';
$gallery_id = '';
$_do = (isset($_GET['do'])) ? $_GET['do'] : die();
$_id = (isset($_GET['id'])) ? $_GET['id'] : 'null';
//$_settings = (isset($_POST['data'])) ? $_POST['data'] : 'null';
$_settings = (isset($_GET['data'])) ? $_GET['data'] : 'null';

## return data
switch ($_do)
{
	case 'check_password_file':
		echo json_encode( check_password_file() );
		break;

	case 'log_in':
		echo json_encode( log_in() );
		break;

	case 'save_password':
		echo json_encode( save_password() );
		break;

	case 'get_menu':
		echo json_encode( get_menu() );
		break;

	case 'get_gallery':
		echo json_encode( get_gallery($_id) );
		break;

	case 'get_info':
		echo json_encode( get_gallery_info($_id) );
		break;

	case 'get_photos':
		echo json_encode( get_gallery_photos($_id) );
		break;

	case 'get_thumbs':
		echo check_images($_id);
		break;

	case 'get_thumbnails':
		echo json_encode( create_thumbs() );
		break;

	case 'get_images':
		echo json_encode( check_all_images() );
		break;

	case 'create_thumb':
		echo create_thumb( $_id );
		break;

	case 'save_settings':
		save_settings($_settings);
		break;

	default:
		die();
}

?>
