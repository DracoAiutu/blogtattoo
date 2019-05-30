<?php
	
	error_reporting(E_ALL);
	
	include_once('functions.php');
	
	echo('start<br><hr>');
	
	echo check_all_images(true);
	//echo check_all_images(false);
	
	echo('<hr><br>end');
	
?>