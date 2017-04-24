
jQuery(document).ready(function($)
{
	var pos = 0; // sets the eventID number
	var windowResize;
	document.getElementById("eventName").focus();
	
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
		 
		 //mq = 'desktop';
		//in this case you are on a desktop version (first load or resize from mobile)
		if( mq == 'desktop' )//&& !this.element.hasClass('js-full') ) 
		{	 
			this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
			 
			this.element.addClass('js-full'); ////////test if/when removing this line breaks it
			 
			this.placeEvents();
			this.element.hasClass('modal-is-open') && this.checkEventModal();
		} 
		
		//in this case you are on a mobile version (first load or resize from desktop)
		else if(  mq == 'mobile' )//&& this.element.hasClass('js-full') ) 
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
			var colorChoice = $(this).data('color') + ' !important';
			 // select background color of event based on form choice stored in 'data-color'
			//$('.single-event')[count].style.removeAttribute('background-color');
			//$('.single-event')[count].style.setProperty('background-color', $(this).data('color'), 'important' );
			//$('.single-event').eq(count).css('cssText', $('.single-event').eq(count).attr('style')+'background-color: ' + $(this).data('color') + ' !IMPORTANT;');
			$('.single-event').eq(count).css( 'background-color', $(this).data('color') );
			//$('.header-bg').eq(count).css( 'background-color', $(this).data('color') );
			$('.header-bg').eq(count).css('cssText', $('.single-event').eq(count).attr('style')+'background-color: ' + $(this).data('color') + ' !IMPORTANT;');
			count = count + 1;
			
			var timeArrStart = $(this).data('start').split(':'); 
			var timeArrEnd   = $(this).data('end').split(':');
			var startSetting = "am";
			var endSetting = "am";
			
			if(parseInt(timeArrStart[0]) >= parseInt(12))
				startSetting= "pm";
			if(parseInt(timeArrEnd[0]) >= parseInt(12))
				endSetting = "pm";
			
			 // if both start and end hours are PM time values
			if(parseInt(timeArrStart[0]) > parseInt(12) && parseInt(timeArrEnd[0]) > parseInt(12))
			{ 
				// update the start time to reflect 12 hour time
				var newStartHr = parseInt(timeArrStart[0]) - parseInt(12);
				var newStart = newStartHr + ":" + timeArrStart[1];
				
				// update the end time
				var newEndHr = parseInt(timeArrEnd[0]) - parseInt(12);
				var newEnd = newEndHr + ":" + timeArrEnd[1];
				
				// set the time label for the event
				var durationLabel = '<span class="event-date">' + newStart + startSetting + ' - ' + newEnd + endSetting + '</span>';
				
			}
			
			// if only the end time is PM time value
			else if(parseInt(timeArrEnd[0]) > parseInt(12))
			{
				// update the end time to reflect 12 hour time
				var newEndHr = parseInt(timeArrEnd[0]) - parseInt(12);
				var newEnd = newEndHr + ":" + timeArrEnd[1];
				
				// set the time label for the event
				var durationLabel = '<span class="event-date">' + $(this).data('start') + startSetting + ' - ' + newEnd + endSetting + '</span>';
			}
			
			else  
			var durationLabel = '<span class="event-date">' + $(this).data('start') + startSetting + ' - ' + $(this).data('end') + endSetting + '</span>';
			
			 
			// if event is newly added, prepend the start and end time of event
			if($(this).children( "a" ).has( "span" ).length == 0)
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

		$('.event-info').prepend('<h3 class="event-info">' + event.parent().attr('data-content') + '</h3>');
			self.element.addClass('content-loaded');
			
		this.element.addClass('modal-is-open');

		setTimeout(function(){
			//fixes a flash when an event is selected - desktop version only
			event.parent('li').addClass('selected-event');
		}, 10);

		if( mq == 'mobile' ) 
		{
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
	
	$(window).on('resize', function()
	{  
		jQuery("#updateEventsbtn").trigger('click');
		
		if( !windowResize ) {
			windowResize = true;
			(!window.requestAnimationFrame) ? setTimeout(checkResize) : window.requestAnimationFrame(checkResize);
		}
	});

	$(window).keyup(function(event) 
	{
		if (event.keyCode == 27) {
			objSchedulesPlan.forEach(function(element){
				element.closeModal(element.eventsGroup.find('.selected-event'));
			});
		}
	});

	function checkResize()
	{
		objSchedulesPlan.forEach(function(element){
			element.scheduleReset();
		});
		var windowResize = false;
	}
 
	function getScheduleTimestamp(time) 
	{
		//accepts hh:mm format - convert hh:mm to timestamp
		time = time.replace(/ /g,'');
		var timeArray = time.split(':');
		var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
		
		return timeStamp;
	}

	function transformElement(element, value) 
	{ 
		element.css({
		    '-moz-transform': value,
		    '-webkit-transform': value,
			'-ms-transform': value,
			'-o-transform': value,
			'transform': value
		});
	} // end transformElement()
	
	
	// add item from form on click
	 $("#submitadd").click(function(e)
	 {   
		e.stopImmediatePropagation(); 
        e.preventDefault();
	
	var checkboxes = document.querySelectorAll('input[type="checkbox"].weekDayCheckBox');
	var checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);
	
	
	// check if the eventName is filled in
	if(document.getElementById("eventName").value == "")
	{
		document.getElementById("eventName").focus();
		
		$(document.getElementById("helpEventName")).css({"visibility": "visible", "color": "#d9534f"});
		$(document.getElementById("helpCheckBoxes")).css("visibility", "hidden");
		$(document.getElementById("helpStartTime")).css("visibility", "hidden");
		$(document.getElementById("helpEndTime")).css("visibility", "hidden");
	}
	 
	// check at least one checkbox is filled in
	else if(!checkedOne)
	{	
		$(document.getElementById("helpEventName")).css("visibility", "hidden");
		$(document.getElementById("helpCheckBoxes")).css({"visibility": "visible", "color": "#d9534f"});
		$(document.getElementById("helpStartTime")).css("visibility", "hidden");
		$(document.getElementById("helpEndTime")).css("visibility", "hidden");
	}
	
	// check if selected start time is earlier than selected end
	else if(parseInt(document.getElementById("startTime").value) >= parseInt(document.getElementById("endTime").value) )
	{ 
		document.getElementById("startTime").focus();
		document.getElementById("helpStartTime").innerHTML = "Start must be earlier than selected end.";
		$(document.getElementById("helpEventName")).css("visibility", "hidden");
		$(document.getElementById("helpCheckBoxes")).css("visibility", "hidden");
		$(document.getElementById("helpStartTime")).css({"visibility": "visible", "color": "#d9534f"});
		$(document.getElementById("helpEndTime")).css("visibility", "hidden");
	}
 
	// check if end time is filled in
	else if(document.getElementById("endTime").value == "")
	{ 
		document.getElementById("endTime").focus();
		
		$(document.getElementById("helpEventName")).css("visibility", "hidden");
		$(document.getElementById("helpCheckBoxes")).css("visibility", "hidden");
		$(document.getElementById("helpStartTime")).css("visibility", "hidden");	
		$(document.getElementById("helpEndTime")).css({"visibility": "visible", "color": "#d9534f"});
	}
	
	// all conditions to submit are filled 
	else 
	{
		$(document.getElementById("helpEventName")).css("visibility", "hidden");
		$(document.getElementById("helpCheckBoxes")).css("visibility", "hidden");
		$(document.getElementById("helpStartTime")).css("visibility", "hidden");
		$(document.getElementById("helpEndTime")).css("visibility", "hidden");
	 
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
			var stTime = document.getElementById("startTime").value;
			var endTime = document.getElementById("endTime").value;
		 
			var stTimeLbl;
			var endTimeLbl;
			 
			var eventContent = document.getElementById("description").value;
			var eventID = "event" + pos;
			var eventData = "event-" + pos;
			var eventName = document.getElementById("eventName").value;
			var eventColor= document.getElementById("color").value;
			
			if(parseInt(stTime) >= parseInt(12))
				stTimeLbl = stTime + ":00";// PM";
			else	
				stTimeLbl = stTime + ":00";// am";// AM";
			
			if(parseInt(endTime) >= parseInt(12))
				endTimeLbl = endTime + ":00";// PM";
			else	
				endTimeLbl = endTime + ":00";// AM";
			 
			for(var i = 0; i < days.length; i++) // loop through days in week
			{
				var currDay = days[i];
				var checkDay = "cb" + currDay;

				// check if the current day is checked
				if(document.getElementById(checkDay).checked) 
				{ 
					var classDay = "#" + currDay;

					var listItem = '<li class="single-event" data-start="' + stTimeLbl + '" data-end="' + endTimeLbl
						+ '" data-content="' + eventContent 
						+ '" data-color="' + eventColor
						+ '" id="' + eventID 
						+ '" data-event="' + eventData 
						+ '" > <a href="#0">	<em class="event-name">' + eventName + '</em> </a> </li>';

					$(classDay).append( listItem );
			 
				} // end if day is checked 
			} // end for days in week
			
			var list = document.getElementById("timeList");
			var items = list.getElementsByTagName("span");
	 
			var lastTime = list.lastElementChild.textContent;
			 
			var lastTimeArr = lastTime.split(':');
	 
			var lastToCompare = parseInt(document.getElementById("timeList").lastElementChild.textContent);
			if(document.getElementById("timeList").lastElementChild.getAttribute("data-hour") == "pm")
				lastToCompare = lastToCompare + 12;	
			 
			var firstToCompare = parseInt(document.getElementById("timeList").firstElementChild.textContent);
			if(document.getElementById("timeList").firstElementChild.getAttribute("data-hour") == "pm")
				firstToCompare = firstToCompare + 12;
			
			if(parseInt(endTime) > parseInt(lastToCompare))
			{ 
		
				document.getElementById("editEndTimeBox").value = endTime;
				 
				jQuery("#editEndTime").trigger('click'); 
			}
			 
			if(parseInt(stTime) < parseInt(firstToCompare))
			{ 
				document.getElementById("editStartTimeBox").value = stTime;
			
				jQuery("#editStartTime").trigger('click'); 
			}
			
			// push the object!
			objSchedulesPlan.push(new SchedulePlan($(this)));
		 
		}); //  schedules.each(function()
		
	} // end if
  
	// clear the form

	var form = document.getElementById("addEventForm");
	form.reset();
	 
	// refresh the calendar events on the page
	//jQuery("#updateEventsbtn").trigger('click');
	
	// close the Add Event modal window
	jQuery("#closeModalbtn").trigger('click');
	
	} // end eventName has content
	 
	//jQuery("#updateEventsbtn").trigger('click');
	 
}); // end submitbtn
   
 // button click to remove one item by event name
$("#removeSingleItembtn").click(function(e)
 {
	e.stopImmediatePropagation();
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
	e.stopImmediatePropagation();
	e.preventDefault();
	
	var days = new Array("Monday","Tuesday","Wednesday","Thursday","Friday");
	
	for(i=0;i<days.length;i++) // loop through days in week
	{
		var list = document.getElementById(days[i]);
	
		while (list.hasChildNodes()) 
			list.removeChild(list.firstChild);
	 
	} // end for
	
}); // end removeItemsbtn()

  
// edit title on click
$("#editTitle").click(function(e)
 {
	 
	 e.stopImmediatePropagation();
	e.preventDefault();
	
	
	var eventTitle = document.getElementById("editTitleTextBox").value;
	 
    document.getElementById("scheduleTitle").innerHTML = eventTitle;
	 
	//$(".skills").remove();
	   
});

// edit title on click
$("#editDetails").click(function(e)
 {	 
	 
	e.stopImmediatePropagation();
	e.preventDefault();
	
	var item =	document.getElementById("details");
	var visibility = item.style.visibility;
	item.style.visibility = 'visible';
	
	var eventTitle = document.getElementById("editDetailsTextBox").value;
	 
    item.innerHTML = eventTitle;

	//$(".skills").remove();
	   
});

// edit title on click
$("#removeDetails").click(function(e)
 {
	e.stopImmediatePropagation();
	e.preventDefault();
	var item =	document.getElementById("details");
	var visibility = item.style.visibility;
	 
	item.style.visibility = 'hidden';
	   
});


// edit start time on click
$("#editStartTime").click(function(e)
 {
	e.stopImmediatePropagation();
	e.preventDefault();
	
	var newToCompare = parseInt(document.getElementById("editStartTimeBox").value);
	 
	var lastToCompare = parseInt(document.getElementById("timeList").lastElementChild.textContent);
	 
	if(document.getElementById("timeList").lastElementChild.getAttribute("data-hour") == "pm")
	{ 
		lastToCompare = lastToCompare + 12;		
	}
	 
	// check if start time is filled in
	if(document.getElementById("editStartTimeBox").value == "")
	{ 
		document.getElementById("editStartTimeBox").focus();
		document.getElementById("helpEditStartTime").innerHTML = "Please select a valid start time.";
		$(document.getElementById("helpEditStartTime")).css({"visibility": "visible", "color": "#d9534f"});
		//$(document.getElementById("helpEditEndTime")).css("visibility", "hidden");
	}
	// check if the new starting time is later than the current ending time
	else if(parseInt(newToCompare) >= parseInt(lastToCompare))
	{
		document.getElementById("editStartTimeBox").focus();
		document.getElementById("helpEditStartTime").innerHTML = "Start must be earlier than current end.";
		//$(document.getElementById("helpEditEndTime")).css("visibility", "hidden");
		$(document.getElementById("helpEditStartTime")).css({"visibility": "visible", "color": "#d9534f"});
	}
	// check if the new start time conflicts with an existing event
	else if(!canEditStartTime(newToCompare))
	{
		document.getElementById("editStartTimeBox").focus();
		document.getElementById("helpEditStartTime").innerHTML = "Start must be earlier than existing events.";
	//	$(document.getElementById("helpEditEndTime")).css("visibility", "hidden");
		$(document.getElementById("helpEditStartTime")).css({"visibility": "visible", "color": "#d9534f"});
	}
	else
	{
	$(document.getElementById("helpEditStartTime")).css("visibility", "hidden");
	//$(document.getElementById("helpEditEndTime")).css("visibility", "hidden");
	
	var isPM = false;
	
	var list = document.getElementById("timeList");
    var items = list.getElementsByTagName("li");
	 
	var firstTime = list.firstElementChild.textContent;
 
	var firstTimeArr = firstTime.split(':');
 
	var newTime = document.getElementById("editStartTimeBox").value;
 
	if(list.firstElementChild.getAttribute("data-hour") == "pm")
	{
		if(parseInt(firstTimeArr[0]) != parseInt(12))
			var firstTimeLength = parseInt(firstTimeArr[0]) + parseInt(12); 
		else
			var firstTimeLength = parseInt(firstTimeArr[0]);
	}
	else
	{
		if(parseInt(firstTimeArr[0]) == parseInt(12) && list.firstElementChild.getAttribute("data-hour") == "am")
			var firstTimeLength = 0;
		else
			var firstTimeLength = firstTimeArr[0];
	}
	var newTimeLength = newTime;//Arr[0];
	 
	// convert pm time to 12 hour time
	if(parseInt(newTime) >= parseInt(12))
	{	 
		isPM = true;
		//newTime = parseInt(newTime) - parseInt(12); 
	}
	
	//if(parseInt(newTimeLength) == parseInt(12))
	//	newTimeLength = 0;
	
	// if new time is earlier than old time
	if(parseInt(newTimeLength) < parseInt(firstTimeLength))// || parseInt(newTimeLength) == parseInt(12))
	{  
		var difference = (parseInt(firstTimeLength) - parseInt(newTimeLength)) * 2;
 
		var minArr = ["00", "30"];
		var x = 0;
		
		var newItem;
		var newHeight; 
		
		for(var i = 0; i< difference; i++)
		{  
			x = 1 - x;
			
			var newLI = document.createElement('li');
			var newSpan = document.createElement('span');
			 
			var addedTime = parseInt(newTime); 
			
			if(parseInt(firstTimeArr[0]) < parseInt(10))
			{	
				addedTime = parseInt(firstTimeArr[0]) - 1;
			
				if(parseInt(addedTime) == parseInt(0))
				{	
					addedTime = 12;
					newSpan.innerHTML =  addedTime + ":" + minArr[x];
				}
				else
					newSpan.innerHTML =  "&nbsp;" + addedTime + ":" + minArr[x];
			}
			else
			{	
				addedTime = parseInt(firstTimeArr[0]) -1 ;
				newSpan.innerHTML =  addedTime + ":" + minArr[x];
			}
				newLI.appendChild(newSpan);
				
				if(isPM)
					newLI.setAttribute('data-hour', 'pm');
				else
					newLI.setAttribute('data-hour', 'am');
				
				list.insertBefore(newLI, list.childNodes[0]);
				 
			if( minArr[x] == "00")
				firstTimeArr[0] = parseInt(firstTimeArr[0]) - parseInt(1);
			
			if(parseInt(firstTimeArr[0]) > parseInt(12))
				firstTimeArr[0] = parseInt(1);
			
			if(parseInt(firstTimeArr[0]) == parseInt(0))
				firstTimeArr[0] = parseInt(12);
			
		} // end for
		
	} // end if new time earlier than old time
	
	// check if new time is later than old time
	else if( parseInt(newTimeLength) > parseInt(firstTimeLength) )
	{     
		difference = (parseInt(newTimeLength) - parseInt(firstTimeLength)) * 2;// - parseInt(1); 
	 
		for(var i = 0; i < difference; i++)
			 list.removeChild(list.children[0]);
			
	} // end else
	
	// reset height of calendar to hold new items
    newHeight = items.length * 30;
	 
	 var days = new Array("Monday","Tuesday","Wednesday","Thursday","Friday");
	
	for(i=0;i<days.length;i++) // loop through days in week
	{
		var list = document.getElementById(days[i]);
	 
		list.style.height = newHeight + 'px';
	
	 
	} // end for
	 
	 jQuery("#updateEventsbtn").trigger('click');
	 
	} // end else form time filled in 
	
}); // end edit Start Time
 
// edit start time on click
$("#editEndTime").click(function(e)
 {	 
	e.stopImmediatePropagation();
	e.preventDefault();
 
	var newToCompare = parseInt(document.getElementById("editEndTimeBox").value);
	
	var firstToCompare = parseInt(document.getElementById("timeList").firstElementChild.textContent);
	if(document.getElementById("timeList").firstElementChild.getAttribute("data-hour") == "pm")
		firstToCompare = firstToCompare + 12;
	
	if(document.getElementById("timeList").firstElementChild.getAttribute("data-hour") == "am" && parseInt(firstToCompare) == parseInt(12))
		firstToCompare = 0;
	
	// check if start time is filled in
	if(document.getElementById("editEndTimeBox").value == "")
	{
		document.getElementById("editEndTimeBox").focus();
		document.getElementById("helpEditStartTime").innerHTML = "Please select a valid end time.";
		//$(document.getElementById("helpEditStartTime")).css("visibility", "hidden");
		$(document.getElementById("helpEditEndTime")).css({"visibility": "visible", "color": "#d9534f"});
	}
	
	// check if the new end time is earlier than the current start time
	else if(parseInt(newToCompare) <= parseInt(firstToCompare))
	{
		document.getElementById("editEndTimeBox").focus();
		document.getElementById("helpEditEndTime").innerHTML = "End time must be later than current start.";
		//$(document.getElementById("helpEditStartTime")).css("visibility", "hidden");
		$(document.getElementById("helpEditEndTime")).css({"visibility": "visible", "color": "#d9534f"});
	}
	// check if the new end time conflicts with an existing event
	else if(!canEditEndTime(newToCompare))
	{
		document.getElementById("editEndTimeBox").focus();
		document.getElementById("helpEditEndTime").innerHTML = "End time must be later than existing events.";
		//$(document.getElementById("helpEditStartTime")).css("visibility", "hidden");
		$(document.getElementById("helpEditEndTime")).css({"visibility": "visible", "color": "#d9534f"});
	}
	else
	{
	$(document.getElementById("helpEditEndTime")).css("visibility", "hidden");
	
	var isPM = false;
	
	var list = document.getElementById("timeList");
    var items = list.getElementsByTagName("li");
	 
	var lastTime = list.lastElementChild.textContent;
	var lastTimeArr = lastTime.split(':');
	  
	var newTime = document.getElementById("editEndTimeBox").value;
	 			 
	// check if the last time element is a pm time
	if(list.lastElementChild.getAttribute("data-hour") == "pm")
		var lastTimeLength = parseInt(lastTimeArr[0]) + parseInt(12);
	else
		var lastTimeLength = lastTimeArr[0];
	
	var newTimeLength = newTime;
	 
	// convert pm time to 12 hour time
	if(parseInt(newTime) > parseInt(12))
	{	
		isPM = true;
		newTime = parseInt(newTime) - parseInt(12);
		 
	}
	  
	// if new time is later than old time
	if(parseInt(newTimeLength) > parseInt(lastTimeLength))
	{ 
		var difference = (parseInt(newTimeLength) - parseInt(lastTimeLength)) * 2;
		
		var minArr = ["00", "30"];
		var x = 0;
		
		var newItem;
		var newHeight; 
		
		for(var i = items.length, size = items.length+difference; i< size; i++)
		{
			x = 1 - x;
			
			var newLI = document.createElement('li');
			var newSpan = document.createElement('span');
			 
			var addedTime = parseInt(lastTimeArr[0]); 
			
			if(parseInt(addedTime) < parseInt(10))
				newSpan.innerHTML =  "&nbsp;" + addedTime + ":" + minArr[x];
			
			else
				newSpan.innerHTML =  addedTime + ":" + minArr[x];
			  
				newLI.appendChild(newSpan);
				
				if(isPM)
					newLI.setAttribute('data-hour', 'pm');
				else
					newLI.setAttribute('data-hour', 'am');
				
				list.appendChild(newLI);
				 
			if( minArr[x] == "30")
				lastTimeArr[0] = parseInt(lastTimeArr[0]) + parseInt(1);
			
			if(parseInt(lastTimeArr[0]) > 12)
				lastTimeArr[0] = parseInt(1);
			
			if(parseInt(lastTimeArr[0]) == parseInt(0))
				lastTimeArr[0] = parseInt(12);
		} // end for
		
	} // end if new time later than old time
	
	
	// check if new time is earlier than old time
	else if( parseInt(newTimeLength) < parseInt(lastTimeLength) )
	{	 
		difference = (lastTimeLength - newTimeLength) * 2;// - parseInt(1); 
 
		var startInd = parseInt(items.length) - parseInt(difference);
		var endInd = parseInt(items.length);// + parseInt(1);
		 
		for(var i = endInd-1, size = startInd; i>= size; i--)
			list.removeChild(list.children[i]);
			
	} // end else
	
	// reset height of calendar to hold new items
    newHeight = items.length * 30;
	 
	 var days = new Array("Monday","Tuesday","Wednesday","Thursday","Friday");
	
	for(i=0;i<days.length;i++) // loop through days in week
	{
		var list = document.getElementById(days[i]);
	 
		list.style.height = newHeight + 'px';
	
	 
	} // end for
	  
	jQuery("#updateEventsbtn").trigger('click');
	} // end else form time filled in 
	
}); // end edit End Time

$("#clearEditFormbtn").click(function(e)
{	
	e.stopImmediatePropagation();
	e.preventDefault();
	$(document.getElementById("helpEditTitle")).css("visibility", "hidden");
	$(document.getElementById("helpEditDetails")).css("visibility", "hidden");
	$(document.getElementById("helpEditStartTime")).css("visibility", "hidden");
	$(document.getElementById("helpEditEndTime")).css("visibility", "hidden");
	document.getElementById("editCalendarForm").reset();
	document.getElementById("editTitleTextBox").focus();
});


 
$("#submitAllEditsbtn").click(function(e)
{
	 e.stopPropagation();
	e.stopImmediatePropagation();
	e.preventDefault();
	
	 if (e.originalEvent !== undefined)  
		$('.btn-all').trigger('click');	 
	
	$(document.getElementById("helpEditTitle")).css({"visibility": "visible", "color": "#5bc0de"});
	document.getElementById("helpEditTitle").innerHTML = "Your title was updated!";
	
	$(document.getElementById("helpEditDetails")).css({"visibility": "visible", "color": "#5bc0de"});
	document.getElementById("helpEditDetails").innerHTML = "Your details were updated!";
	
	if($("#helpEditStartTime").css("visibility") == "hidden")
	{  
		$(document.getElementById("helpEditStartTime")).css({"visibility": "visible", "color": "#5bc0de"});
		document.getElementById("helpEditStartTime").innerHTML = "Your start time was updated!";
	}
	if($("#helpEditEndTime").css("visibility") == "hidden")
	{  
		$(document.getElementById("helpEditEndTime")).css({"visibility": "visible", "color": "#5bc0de"});
		document.getElementById("helpEditEndTime").innerHTML = "Your end time was updated!";
	}
	document.getElementById("editCalendarForm").reset();
	document.getElementById("editTitleTextBox").focus();
});

//$('.btn-all').on('click', $("#submitAllEditsbtn"));

// edit title on click
$("#updateEventsbtn").click(function(e)
 {
	 e.stopImmediatePropagation();
	e.preventDefault(); 
	 
	// check the list of exiting elements and update their positions in new calendar 
	var schedules = $('.cd-schedule'); 
	
	var objSchedulesPlan = [],
		windowResize = false;
	  
	if( schedules.length > 0 ) 
	{
		schedules.each(function()
		{ 
			// push the object!
			objSchedulesPlan.push(new SchedulePlan($(this)));
			
		}); //  end schedules.each(function()
		
	} // end if
	   
});
 
 
	function canEditStartTime(newToCompare)
	{
		var canEdit = true;
		
		var myList = document.getElementById("weeksEvents");
		var listItems = myList.getElementsByTagName("li");
		 
		for (var i = 0; i < listItems.length; i++) 
		{
			var valToCompare = parseInt(listItems[i].getAttribute('data-start'));
		
			if ( parseInt(newToCompare) >  parseInt(valToCompare) ) 
				canEdit = false;  				
		}
		
		return canEdit;
		
	} // end canEditStartTime()
	 
	function canEditEndTime(newToCompare)
	{
		var canEdit = true;
		
		var myList = document.getElementById("weeksEvents");
		var listItems = myList.getElementsByTagName("li");
		 
		for (var i = 0; i < listItems.length; i++) 
		{
			var valToCompare = parseInt(listItems[i].getAttribute('data-end'));
		
			if ( parseInt(newToCompare) <  parseInt(valToCompare) ) 
				canEdit = false;  				
		}
		
		return canEdit;
		
	} // end canEditEndTime() 

	
  /*  function printDiv(divID) 
   {
            //Get the HTML of div
            var divElements = document.getElementById(divID).innerHTML;
            //Get the HTML of whole page
            var oldPage = document.body.innerHTML;

            //Reset the page's HTML with div's HTML only
            document.body.innerHTML =
                "<html><head><title></title></head><body>" +
                divElements + "</body>";

            //Print Page
            window.print();

            //Restore orignal HTML
            document.body.innerHTML = oldPage;

        } */

}); 

 