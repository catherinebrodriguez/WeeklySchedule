
jQuery(document).ready(function($)
{
	var pos = 0; // sets the eventID number
	
	// add item from form on click
	 $("#submit").click(function(e)
	 {
        e.preventDefault();
	
	var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
	var transitionsSupported = ( $('.csstransitions').length > 0 );
	
	//if browser does not support transitions - use a different event to trigger them
	if( !transitionsSupported ) 
		transitionEnd = 'noTransition';
	 
	function SchedulePlan( element ) 
	{
		this.element = element;
		this.timeline = this.element.find('.timeline');
		this.timelineItems = this.timeline.find('li');
		this.timelineItemsNumber = this.timelineItems.length;
		this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
		
		//need to store delta (in our case half hour) timestamp
		this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());
		 
		//alert(this.eventTestItems.eq(0).text());
		//alert(this.eventTestItems.eq(0).attr('value')); ////////////
		//alert(this.eventTestItems.eq(0).attr('data-color'));
		
		this.eventsWrapper = this.element.find('.events');
		this.eventsGroup = this.eventsWrapper.find('.events-group');
		this.singleEvents = this.eventsGroup.find('.single-event');
		this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
		
		this.modal = this.element.find('.event-modal');
		this.modalHeader = this.modal.find('.header');
		this.modalHeaderBg = this.modal.find('.header-bg');
		 //$('.header-bg').eq(0).css( 'background-color', $(this).data('color') );
		this.modalBody = this.modal.find('.body'); 
		this.modalBodyBg = this.modal.find('.body-bg'); 
		this.modalMaxWidth = 600;
		this.modalMaxHeight = 480;

		this.animating = false;

		this.initSchedule();
	}

	SchedulePlan.prototype.initSchedule = function() 
	{
		this.scheduleReset();
		this.initEvents();
	};

	SchedulePlan.prototype.scheduleReset = function() 
	{
		var mq = this.mq();
		
		//in this case you are on a desktop version (first load or resize from mobile)
	if( mq == 'desktop' )//&& !this.element.hasClass('js-full') ) 
		{
			this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
			 
			//this.element.addClass('js-full'); ////////test if/when removing this line breaks it
			
			this.placeEvents();
			this.element.hasClass('modal-is-open') && this.checkEventModal();
		} 
		
		//in this case you are on a mobile version (first load or resize from desktop)
		else if(  mq == 'mobile' && this.element.hasClass('js-full') ) 
		{		
			this.element.removeClass('js-full loading');
			this.eventsGroup.children('ul').add(this.singleEvents).removeAttr('style');
			this.eventsWrapper.children('.grid-line').remove();
			this.element.hasClass('modal-is-open') && this.checkEventModal();
		} 
		//on a mobile version with modal open - need to resize/move modal window
		else if( mq == 'desktop' && this.element.hasClass('modal-is-open'))
		{			
			this.checkEventModal('desktop');
			this.element.removeClass('loading');
		} 
		
		else 
		{
			this.element.removeClass('loading');
		}
	}; // end scheduleReset() 

	SchedulePlan.prototype.initEvents = function() 
	{
		var self = this;
		var count = 0;
		this.singleEvents.each(function()
		{
			//alert($(this).data('color'));
			alert("init");
			 // select background color of event based on form choice stored in 'data-color'
			$('.single-event').eq(count).css( 'background-color', $(this).data('color') );
			$('.header-bg').eq(count).css( 'background-color', $(this).data('color') );
			count = count + 1;
			 
			//create the .event-date element for each event
			var durationLabel = '<span class="event-date">'+$(this).data('start')+' - '+$(this).data('end')+'</span>';
			$(this).children('a').prepend($(durationLabel));

			//detect click on the event and open the modal
			$(this).on('click', 'a', function(event)
			{
				event.preventDefault();
				if( !self.animating ) self.openModal($(this));
			});
			
		}); // end singleEvents.each()

		//close modal window
		this.modal.on('click', '.close', function(event)
		{
			event.preventDefault();
			if( !self.animating ) self.closeModal(self.eventsGroup.find('.selected-event'));
		});
		
		this.element.on('click', '.cover-layer', function(event)
		{
			if( !self.animating && self.element.hasClass('modal-is-open') ) self.closeModal(self.eventsGroup.find('.selected-event'));
		});
		
	}; // end initEvents()

	SchedulePlan.prototype.placeEvents = function() 
	{
		var self = this;
		
		this.singleEvents.each(function()
		{
			//place each event in the grid -> need to set top position and height
			var start = getScheduleTimestamp($(this).attr('data-start')),
				duration = getScheduleTimestamp($(this).attr('data-end')) - start;

			var eventTop = self.eventSlotHeight*(start - self.timelineStart)/self.timelineUnitDuration,
				eventHeight = self.eventSlotHeight*duration/self.timelineUnitDuration;
			
			$(this).css({
				top: (eventTop -1) +'px',
				height: (eventHeight+1)+'px'
			});
			
		}); // end singleEvents.each()

		this.element.removeClass('loading');
	}; // end placeEvents = function() 

	SchedulePlan.prototype.openModal = function(event) 
	{
		var self = this;
		var mq = self.mq();
		this.animating = true;
		
		//update event name and time
		this.modalHeader.find('.event-name').text(event.find('.event-name').text());
		this.modalHeader.find('.event-date').text(event.find('.event-date').text());
		 
		this.modalHeader.css( 'background-color', event.parent().attr('data-color') );
		 
		//update event content
		this.modalBody.find('.event-info').load(event.parent().attr('data-content')+'.html .event-info > *', function(data){
			//once the event content has been loaded
			self.element.addClass('content-loaded');
		});

		this.element.addClass('modal-is-open');

		setTimeout(function(){
			//fixes a flash when an event is selected - desktop version only
			event.parent('li').addClass('selected-event');
		}, 10);

		if( mq == 'mobile' ) {alert("mobile!");
			self.modal.one(transitionEnd, function(){
				self.modal.off(transitionEnd);
				self.animating = false;
			});
		} else {
			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var windowWidth = $(window).width(),
				windowHeight = $(window).height();

			var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
				modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

			var modalTranslateX = parseInt((windowWidth - modalWidth)/2 - eventLeft),
				modalTranslateY = parseInt((windowHeight - modalHeight)/2 - eventTop);
			
			var HeaderBgScaleY = modalHeight/eventHeight,
				BodyBgScaleX = (modalWidth - eventWidth);

			//change modal height/width and translate it
			self.modal.css(
			{
				top: eventTop+'px',
				left: eventLeft+'px',
				height: modalHeight+'px',
				width: modalWidth+'px',
			});
			transformElement(self.modal, 'translateY('+modalTranslateY+'px) translateX('+modalTranslateX+'px)');

			//set modalHeader width
			self.modalHeader.css(
			{
				width: eventWidth+'px',
			});
			//set modalBody left margin
			self.modalBody.css(
			{
				marginLeft: eventWidth+'px',
			});

			//change modalBodyBg height/width ans scale it
			self.modalBodyBg.css(
			{
				height: eventHeight+'px',
				width: '1px',
			});
			transformElement(self.modalBodyBg, 'scaleY('+HeaderBgScaleY+') scaleX('+BodyBgScaleX+')');

			//change modal modalHeaderBg height/width and scale it
			self.modalHeaderBg.css(
			{
				height: eventHeight+'px',
				width: eventWidth+'px',
			});
			transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
			
			self.modalHeaderBg.one(transitionEnd, function()
			{
				//wait for the  end of the modalHeaderBg transformation and show the modal content
				self.modalHeaderBg.off(transitionEnd);
				self.animating = false;
				self.element.addClass('animation-completed');
			});
			
		} // end else

		//if browser do not support transitions -> no need to wait for the end of it
		if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
	}; // end openModal()

	SchedulePlan.prototype.closeModal = function(event) 
	{
		var self = this;
		var mq = self.mq();

		this.animating = true;

		if( mq == 'mobile' ) 
		{
			this.element.removeClass('modal-is-open');
			this.modal.one(transitionEnd, function(){
				self.modal.off(transitionEnd);
				self.animating = false;
				self.element.removeClass('content-loaded');
				event.removeClass('selected-event');
			});
		} 
		else 
		{
			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var modalTop = Number(self.modal.css('top').replace('px', '')),
				modalLeft = Number(self.modal.css('left').replace('px', ''));

			var modalTranslateX = eventLeft - modalLeft,
				modalTranslateY = eventTop - modalTop;

			self.element.removeClass('animation-completed modal-is-open');

			//change modal width/height and translate it
			this.modal.css({
				width: eventWidth+'px',
				height: eventHeight+'px'
			});
			transformElement(self.modal, 'translateX('+modalTranslateX+'px) translateY('+modalTranslateY+'px)');
			
			//scale down modalBodyBg element
			transformElement(self.modalBodyBg, 'scaleX(0) scaleY(1)');
			//scale down modalHeaderBg element
			transformElement(self.modalHeaderBg, 'scaleY(1)');

			this.modalHeaderBg.one(transitionEnd, function()
			{
				//wait for the  end of the modalHeaderBg transformation and reset modal style
				self.modalHeaderBg.off(transitionEnd);
				self.modal.addClass('no-transition');
				setTimeout(function()
				{
					self.modal.add(self.modalHeader).add(self.modalBody).add(self.modalHeaderBg).add(self.modalBodyBg).attr('style', '');
				}, 10);
				setTimeout(function()
				{
					self.modal.removeClass('no-transition');
				}, 20);

				self.animating = false;
				self.element.removeClass('content-loaded');
				event.removeClass('selected-event');
			});
		}

		//browser do not support transitions -> no need to wait for the end of it
		if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
	}; // end closeModal()

	SchedulePlan.prototype.mq = function()
	{
		//get MQ value ('desktop' or 'mobile') 
		var self = this;
		return window.getComputedStyle(this.element.get(0), '::before').getPropertyValue('content').replace(/["']/g, '');
	};

	SchedulePlan.prototype.checkEventModal = function(device) 
	{
		this.animating = true;
		var self = this;
		var mq = this.mq();

		if( mq == 'mobile' ) 
		{
			//reset modal style on mobile
			self.modal.add(self.modalHeader).add(self.modalHeaderBg).add(self.modalBody).add(self.modalBodyBg).attr('style', '');
			self.modal.removeClass('no-transition');	
			self.animating = false;	
		} 
		
		else if( mq == 'desktop' && self.element.hasClass('modal-is-open') ) 
		{
			self.modal.addClass('no-transition');
			self.element.addClass('animation-completed');
			var event = self.eventsGroup.find('.selected-event');

			var eventTop = event.offset().top - $(window).scrollTop(),
				eventLeft = event.offset().left,
				eventHeight = event.innerHeight(),
				eventWidth = event.innerWidth();

			var windowWidth = $(window).width(),
				windowHeight = $(window).height();

			var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
				modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

			var HeaderBgScaleY = modalHeight/eventHeight,
				BodyBgScaleX = (modalWidth - eventWidth);

			setTimeout(function()
			{
				self.modal.css(
				{
					width: modalWidth+'px',
					height: modalHeight+'px',
					top: (windowHeight/2 - modalHeight/2)+'px',
					left: (windowWidth/2 - modalWidth/2)+'px',
				});
				transformElement(self.modal, 'translateY(0) translateX(0)');
				//change modal modalBodyBg height/width
				self.modalBodyBg.css(
				{
					height: modalHeight+'px',
					width: '1px',
				});
				transformElement(self.modalBodyBg, 'scaleX('+BodyBgScaleX+')');
				//set modalHeader width
				self.modalHeader.css(
				{
					width: eventWidth+'px',
				});
				//set modalBody left margin
				self.modalBody.css(
				{
					marginLeft: eventWidth+'px',
				});
				//change modal modalHeaderBg height/width and scale it
				self.modalHeaderBg.css(
				{
					height: eventHeight+'px',
					width: eventWidth+'px',
				});
				transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
			}, 10);

			setTimeout(function()
			{
				self.modal.removeClass('no-transition');
				self.animating = false;	
			}, 20);
		}
	}; // end checkEventModal()
	
	
	// start the actions
	var schedules = $('.cd-schedule'); 
	var objSchedulesPlan = [],
		windowResize = false;
		
	var days = new Array("Monday","Tuesday","Wednesday","Thursday","Friday");
	 
	if( schedules.length > 0 ) 
	{
		schedules.each(function()
		{
			//create SchedulePlan objects
			 
			// append a new li item from the form selections
			pos = pos + 1;
			var stTime = document.getElementById("startTimeH").value;
			var endTime = document.getElementById("endTimeH").value;
			var eventContent = "event-abs-circuit2";
			var eventID = "event" + pos;
			var eventData = "event-" + pos;
			var eventName = document.getElementById("eventName").value;
			var eventColor= document.getElementById("color").value;

			for(i=0;i<days.length;i++) // loop through days in week
			{
				var currDay = days[i];
				var checkDay = "cb" + currDay;

				if(document.getElementById(checkDay).checked) 
				{

					var classDay = "#" + currDay;

					var listItem = '<li class="single-event" data-start="' + stTime + '" data-end="' + endTime 
						+ '" data-content="' + eventContent 
						+ '" data-color="' + eventColor
						+ '" id="' + eventID 
						+ '" data-event="' + eventData 
						+ '" > <a href="#0">	<em class="event-name">' + eventName + '</em> </a> </li>';

					$(classDay).append( listItem );
			
				// following lines are just tests that display the list items in text below buttons
				//var node = document.createElement("li");    
				//var textNode = document.createTextNode(eventName);    
				//node.appendChild(textNode);     
				//document.getElementById('textList').appendChild(node);
  
				} // end if day is checked 
			} // end for days in week
			
			// push the object!
			objSchedulesPlan.push(new SchedulePlan($(this)));
			
		}); //  schedules.each(function()
		
	} // end if

	$(window).on('resize', function(){
		if( !windowResize ) {
			windowResize = true;
			(!window.requestAnimationFrame) ? setTimeout(checkResize) : window.requestAnimationFrame(checkResize);
		}
	});

	$(window).keyup(function(event) {
		if (event.keyCode == 27) {
			objSchedulesPlan.forEach(function(element){
				element.closeModal(element.eventsGroup.find('.selected-event'));
			});
		}
	});

	function checkResize(){
		objSchedulesPlan.forEach(function(element){
			element.scheduleReset();
		});
		windowResize = false;
	}

	function getScheduleTimestamp(time) {
		//accepts hh:mm format - convert hh:mm to timestamp
		time = time.replace(/ /g,'');
		var timeArray = time.split(':');
		var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
		return timeStamp;
	}

	function transformElement(element, value) {
		element.css({
		    '-moz-transform': value,
		    '-webkit-transform': value,
			'-ms-transform': value,
			'-o-transform': value,
			'transform': value
		});
	} // end transformElement()
	 
}); // end submitbtn
 
 // button click to remove one item by event name
$("#removeSingleItembtn").click(function(e)
 {
    e.preventDefault();
	
	var eventToRemove = prompt("Please enter the name of the event to remove", "EventTest");
	
	// map single-event li items to find event matching prompted event name text
	var mappedItems = $( "li.single-event" ).map(function( index ) 
	{ 
		var currEventName = $( this ).find("em").html();
		 
		if( currEventName == eventToRemove )
		{ 
			var item = document.getElementById($(this).attr('id'));
			item.parentNode.removeChild(item);
			
		} // end if
    
	});   // end map
 
}); // end removeSingleItembtn()

// remove all items on click
$("#removeItemsbtn").click(function(e)
 {
	e.preventDefault();
	
	var days = new Array("Monday","Tuesday","Wednesday","Thursday","Friday");
	
	for(i=0;i<days.length;i++) // loop through days in week
	{
		var list = document.getElementById(days[i]);
	
		while (list.hasChildNodes()) 
			list.removeChild(list.firstChild);
	 
	} // end for
	
}); // end removeItemsbtn()

}); 

 