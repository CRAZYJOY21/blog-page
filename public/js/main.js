AOS.init({
 	duration: 800,
 	easing: 'slide',
 	once: true
});

jQuery(document).ready(function($) {
	"use strict";

	var siteCarousel = function () {
		if ( $('.hero-slide').length > 0 ) {
			$('.hero-slide').owlCarousel({
				items: 1,
				loop: true,
				margin: 0,
				autoplay: true,
				nav: true,
				dots: true,
				navText: ['<span class="icon-arrow_back">', '<span class="icon-arrow_forward">'],
				smartSpeed: 1000
			});
		}
	};
	siteCarousel();

	var siteSticky = function() {
		$(".js-sticky-header").sticky({topSpacing:0});
	};
	siteSticky();
});