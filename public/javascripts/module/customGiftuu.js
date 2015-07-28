$(function() {
    setTimeout(function(){
        $('a.search-dropdown').mousedown( function() {
            $('div.searchParent input, a.search-dropdown, a.searchButton').addClass('active');
        });

        if ($('div.free-wall').length > 0) {

        }
	
	//login scroll lower

    //$('html, body').animate({scrollTop: $('.logoTop').offset().top -100 }, 'slow');

    // Giftuu slider

        $browerHeight = $('html').height();
        $owlWrapperHeight = $('div.owl-wrapper-outer').height()
        $navBarHeight = $('div.navbar').height()
        $('div.given-away').height($owlWrapperHeight - 30)
        $('div.deactivated-gift').height($browerHeight - $navBarHeight)


    },500);


});


