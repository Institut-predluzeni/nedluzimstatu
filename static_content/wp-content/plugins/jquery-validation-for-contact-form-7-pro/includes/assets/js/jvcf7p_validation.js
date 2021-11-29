// VALIDATION CODES
jQuery(document).ready(function(){
	
	jQuery('.wpcf7-validates-as-required').addClass('required');
	jQuery('.wpcf7-email').addClass('email');
	jQuery('.wpcf7-checkbox.wpcf7-validates-as-required input').addClass('required');
	jQuery('.wpcf7-radio input').addClass('required');
	
	jQuery('form.wpcf7-form').each(function(){
		jQuery(this).addClass(scriptData.jvcf7p_default_settings.jvcf7p_invalid_field_design);
		jQuery(this).addClass(scriptData.jvcf7p_default_settings.jvcf7p_show_label_error);
		jQuery('.wpcf7-file').attr('accept','');
		jQuery(this).validate({
			onfocusout: function(element) { // ADD VALIDATION ON BLUR
		        this.element(element);  
		    },
			errorPlacement: function(error, element) {
	            if (element.is(':checkbox') || element.is(':radio')){
	            	error.insertAfter(jQuery(element).parent().parent().parent());
	            } else {
	            	error.insertAfter(element);
	            }
         	}
		});
	});

	jQuery('.wpcf7-form-control.wpcf7-submit').click(function(e){ 
		$jvcfpValidation 	=	jQuery(this).parents('form');
		jQuery($jvcfpValidation).valid();
		
		if (jQuery($jvcfpValidation).validate().pendingRequest != 0){ // is Remote Call is Pending
			e.preventDefault();
			$topPendingPosition 		= jQuery('.wpcf7-form-control.pending').offset().top;
			$topPendingPosition			= parseInt($topPendingPosition) - 100;
			jQuery('body, html').animate({scrollTop:$topPendingPosition}, 'normal');
		}
		
		if (!jQuery($jvcfpValidation).valid()){ // If form invalid
			e.preventDefault();
			$topErrorPosition 		= jQuery('.wpcf7-form-control.error').offset().top;
			$topErrorPosition		= parseInt($topErrorPosition) - 100;
			jQuery('body, html').animate({scrollTop:$topErrorPosition}, 'normal');
		}
	});
	
	jQuery('[class*="JVmin-"]').each(function(){ // Min
		allClasser = jQuery(this).attr('class');
		processingClass 		= allClasser.match(/JVmin-[0-9]+/);
		var processingClassSplit	= processingClass.toString().split("-");
		jQuery(this).attr('min',processingClassSplit[1]);
	});
	
	jQuery('[class*="JVmax-"]').each(function(){ // Max
		allClasser = jQuery(this).attr('class');
		processingClass 		= allClasser.match(/JVmax-[0-9]+/);
		var processingClassSplit	= processingClass.toString().split("-");
		jQuery(this).attr('max',processingClassSplit[1]);
	});
	
	jQuery('[class*="JVminlength-"]').each(function(){ // Minlength
		allClasser = jQuery(this).attr('class');
		processingClass 		= allClasser.match(/JVminlength-[0-9]+/);
		var processingClassSplit	= processingClass.toString().split("-");
		jQuery(this).rules( "add", {minlength: processingClassSplit[1]});
	});
	
	jQuery('[class*="JVmaxlength-"]').each(function(){ // Maxlength
		allClasser = jQuery(this).attr('class');
		processingClass 			= allClasser.match(/JVmaxlength-[0-9]+/);
		var processingClassSplit	= processingClass.toString().split("-");
		jQuery(this).rules( "add", {maxlength: processingClassSplit[1]});
	});
	
	jQuery('[class*="JVrangelength-"]').each(function(){ // rangelength
		allClasser = jQuery(this).attr('class');
		processingClass 			= allClasser.match(/JVrangelength-[0-9]+-[0-9]+/);
		var processingClassSplit	= processingClass.toString().split("-");
		jQuery(this).rules( "add", {rangelength: [processingClassSplit[1],processingClassSplit[2] ]});
	});
	
	jQuery('[class*="JVrange-"]').each(function(){ // range
		allClasser = jQuery(this).attr('class');
		processingClass 			= allClasser.match(/JVrange-[0-9]+-[0-9]+/);
		var processingClassSplit	= processingClass.toString().split("-");
		jQuery(this).rules( "add", {range: [processingClassSplit[1],processingClassSplit[2] ]});
	});
	
	jQuery('[class*="JVequalTo-"]').each(function(){ // range
		allClasser = jQuery(this).attr('class');
		processingClass 			= allClasser.match(/JVequalTo-[a-zA-Z0-9-_]+/);
		var processingClassSplit	= processingClass.toString().split("To-");
		jQuery(this).rules( "add", {equalTo: "[name="+processingClassSplit[1]+"]" });
	});
	
	jQuery('[class*="JVextension-"]').each(function(){ // range
		allClasser = jQuery(this).attr('class');
		processingClass 				= allClasser.match(/JVextension-[a-zA-Z0-9-_]+/);
		var processingClassSplit		= processingClass.toString().split("extension-");
		var processingExtensionSplit	= processingClassSplit[1].toString().split("_");
		var extnesions 					= processingExtensionSplit.join('|');
		jQuery(this).rules( "add", {extension: extnesions });		
	});
		
	jQuery('[class*="JVrequireGroup-"]').each(function(){ // range
		allClasser = jQuery(this).attr('class');
		processingClass 				= allClasser.match(/JVrequireGroup-[a-zA-Z0-9-_]+/);
		var processingClassSplit		= processingClass.toString().split("requireGroup-");
		var processingCountClassSplit	= processingClassSplit[1].toString().split("_");
		jQuery(this).addClass(processingCountClassSplit[1]);
		jQuery(this).rules( "add", {require_from_group: [processingCountClassSplit[0], "."+processingCountClassSplit[1]] });		
	});

	jQuery('input.checkUsername').each(function(){
		jQuery(this).rules( "add", {
			"remote": {
				'url'  : scriptData.jvcf7p_ajax_url,
				'type' : "post",
				'data' : {
					"method":"checkUsername",
					"fieldname" : jQuery(this).attr('name')
				}
			}
		});
	});

	jQuery('input.customCode').each(function(){
		jQuery(this).rules( "add", {
			"remote": {
				'url'  : scriptData.jvcf7p_ajax_url,
				'type' : "post",
				'data' : {
					"method":"customCode_deprecated",
					"fieldname" : jQuery(this).attr('name')
				}
			}
		});
	});

	jQuery('[class*="CCode-"]').each(function(){ // NEW MULTI CUSTOM CODE
		allClasser = jQuery(this).attr('class');
		processingClass 				= allClasser.match(/CCode-[0-9]+/);
		var processingClassSplit		= processingClass.toString().split("-");
		CustomValidatonID 				= processingClassSplit[1];

		jQuery(this).rules( "add", {
			"remote": {
				'url'  : scriptData.jvcf7p_ajax_url,
				'type' : "post",
				'data' : {
					"method"				: "customCode",
					"fieldname" 			: jQuery(this).attr('name'),
					"custom_validation_id"	: CustomValidatonID
				}
			}
		});
	});

	// EMAIL VERIFICATION
	jQuery('input.emailVerify').each(function(){		
		elementName  	= jQuery(this).attr('name');
		elementSize		= jQuery(this).outerWidth();
		saveButton 		= '<span style="width:'+elementSize+'px;" class="verification_code_holder"><input type="text" name="email-verification-code" data-for="'+elementName+'" class="wpcf7-form-control wpcf7-text verifyEmailCode required" value="" placeholder="'+scriptData.jvcf7p_default_settings.jvcf7p_verify_code_field_placeholder+'" /><input type="button" class="jvcf7_verify_email_btn" value="'+scriptData.jvcf7p_default_settings.jvcf7p_code_send_button_label+'" data-for="'+elementName+'" id="jvcf7_verify_email_btn" style="display:none;" /></span>';
		jQuery(saveButton).insertAfter(this);

		
		jQuery('.verifyEmailCode').rules( "add", {
			'required':true,
			"remote": {
				'url'  : scriptData.jvcf7p_ajax_url,
				'type' : "post",
				'data' : {
					"method":"verifyEmailCode",
					"fieldname" : "email-verification-code",
					"email" 	: function (){return jQuery('input[name='+elementName+']').val();}

				}
			}
		});
		jQuery('.jvcf7_verify_email_btn').show();
	});

	jQuery('input.jvcf7_verify_email_btn').click(function(){
			 fieldname = jQuery(this).attr('data-for');
			 if (jQuery("input[name="+fieldname+"]").valid() == true){
				 jQuery.ajax({
				 	url  : scriptData.jvcf7p_ajax_url,
				 	context:this,
				 	type : "post",
					data : {
								"method"			: "sendVerificationCode",
								"email" 			: jQuery("input[name="+fieldname+"]").val()
							 },
				    beforeSend: function() {
				        jQuery(this).removeClass('valid');
				        jQuery(this).attr('value','Sending..');			        
				    },
				    success: function(data) {
				      	jQuery(this).removeClass('valid');
				      	jQuery(this).attr('value','Resend Code');			      	
					},
				    error: function() {
				    	jQuery(this).removeClass('valid');
				    	jQuery(this).attr('value','Error !');
				    }
				  });
			} else {
				jQuery("input[name="+fieldname+"]").focus();
			}

	});
});

jQuery.validator.addMethod("email", 
    function(value, element) {
        return this.optional(element) || /^[+\w-\.]+@([\w-]+\.)+[\w-]{2,10}$/i.test(value);
    },"Please enter a valid email address"
);

jQuery.validator.addMethod("letters_space", function(value, element) {
  return this.optional(element) || /^[a-zA-Z ]*$/.test(value);
}, "Letters and space only");

jQuery.validator.addMethod("stateUS", function (state, element) {
    return this.optional(element) || state.match(/^(A[LKSZRAEP]|C[AOT]|D[EC]|F[LM]|G[ANU]|HI|I[ADLN]|K[SY]|LA|M[ADEHINOPST]|N[CDEHJMVY]|O[HKR]|P[ARW]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$/);
}, "Please specify a valid state");

var regExs = [];
for (const validationID in scriptData.jvcf7p_regexs) {
	regExs[validationID] = new RegExp(scriptData.jvcf7p_regexs[validationID].regex,'i');
  	errorMsg  	= scriptData.jvcf7p_regexs[validationID].error_mg;
  	jQuery.validator.addMethod("RegEx-"+validationID, function(value, element) {
	  return this.optional(element) || regExs[validationID].test(value);
	}, errorMsg );
}

jQuery.extend(jQuery.validator.messages,scriptData.jvcf7p_default_error_msgs);