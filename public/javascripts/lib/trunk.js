$(function() {

	/*Define Click Event for Mobile */
	if( 'ontouchstart' in window ){ var click = 'touchstart'; }
	else { var click = 'click'; }

	var content = $('.content');
	var items = $('.content, nav');

	function open() {
		$(items).removeClass('close').addClass('open');
	}
	function close() {
		$(items).removeClass('open').addClass('close');
	}

	$('#navToggle').on(click, function(){
		if (content.hasClass('open')) {
			close()
		}
		else {
			open()
		}
	});
	$('.social-feed').on(click, function(){
		if (content.hasClass('open')) {
			close()
		}
	});

});