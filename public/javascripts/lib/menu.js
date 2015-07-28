
/*	Define Click Event for Mobile */
	if( 'ontouchstart' in window ){ var click = 'touchstart'; }
	else { var click = 'click'; }



	
	/*	Reveal Menu */
	$('div.button').on(click, function(){
		if( !$('div.content').hasClass('inactive') ){
			// Remove circle
			$('div.circle').remove();
		
			// Slide and scale content
			$('div.content').addClass('inactive');
			setTimeout(function(){ $('div.content').addClass('flag'); }, 100);
			
			// Change status bar
			$('div.status').fadeOut(100, function(){
				$(this).toggleClass('active').fadeIn(300);
			});
			
			// Slide in menu links
			var timer = 0;
			$.each($('li'), function(i,v){
				timer = 40 * i;
				setTimeout(function(){
					$(v).addClass('visible');
				}, timer);
			});
		}
	});
	
	

	/*	Close Menu */
	function closeMenu() {		
		// Slide and scale content
		$('div.content').removeClass('inactive flag');
		
		// Change status bar
		$('div.status').fadeOut(100, function(){
			$(this).toggleClass('active').fadeIn(300);
		});
		
		// Reset menu
		setTimeout(function(){
			$('li').removeClass('visible');
		}, 300);
	}
	
	$('div.content').on(click, function(){
		if( $('div.content').hasClass('flag') ){
			closeMenu();
		}
	});
	$('li a').on(click, function(e){
		//e.preventDefault();
		closeMenu();
	});
	
	//width to be fixed for dropdown
	function fixDropdown() {
		$browerWidth = $(window).width();
		if($browerWidth <= 768) {
			$('ul.dropdown-menu, li.divider, ul.dropdown-menu a').css('width', $browerWidth - 1);
		}
	}

	$('a.dropdown-toggle').on("tap",function(){
		fixDropdown()
	});

	$('a.dropdown-toggle').mouseup(function() {
		fixDropdown()
	});
	
	
	//Add class to search field

	$('div.searchParent input').focus(function(){
		$('div.searchParent input, a.search-dropdown, a.searchButton').addClass('active');
	});

	$('a.search-dropdown').mousedown( function() {
		$('div.searchParent input, a.search-dropdown, a.searchButton').addClass('active');
	});
	

	
	//Character limit
	
	/*var maxNum = function($elie, num) {
    var $this;
    $elie.each(function() {
        $this = $(this);
        $this.text( $this.text().slice(0,num) );
    });
}

	$(function() {
		maxNum($('.giftWrap h4'),23);
		
	});*/
