/**
 * Automatic NBSP dashboard JavaScript functionality
 *
 * ==================================================================== */
(function($){
    $(function(){

    
    $(document).ready(function(){
        
        $('#dgwt-nbsp-import').click(function(){
            
            var lang = $('#dgwt-nbsp-language').val();
            
            var phrases = $('#dgwt-nbsp-'+ lang);
            
            if(phrases.length > 0){
                
                $('textarea[name="dgwt_automatic_nbsp[words]"]').val(phrases.val());

            }
            
            return false;
            
        });
        
        
        
    });





    });
})(jQuery)

