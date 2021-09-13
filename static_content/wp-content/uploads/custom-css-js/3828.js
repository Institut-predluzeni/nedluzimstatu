<!-- start Simple Custom CSS and JS -->
<script type="text/javascript">
document.addEventListener("DOMContentLoaded", function() {
  try {
    MicroModal.init({
      awaitCloseAnimation: true, // set to false, to remove close animation
      onShow: function(modal) {
        console.log("micromodal open");
        addModalContentHeight('short');
        /**************************
          For full screen scrolling modal, 
          uncomment line below & comment line above
         **************************/
        //addModalContentHeight('tall');
      },
      onClose: function(modal) {
        console.log("micromodal close");
      }
    });
  } catch (e) {
    console.log("micromodal error: ", e);
  }
});

function addModalContentHeight(type) {
  var type = (arguments[0] != null) ? arguments[0] : 'short';
  var modalContainer = $("#modal-container");
  var modalHeader = $("#modal-header");
  var modalContentContent = $("#modal-content-content");
  var modalContent = $("#modal-content");
  var modalFooter = $("#modal-footer");

  var modalIsDefined =
    modalContainer.length &&
    modalHeader.length && 
    modalContent.length &&
    modalFooter.length;

  if (modalIsDefined) {
    var modalContainerHeight = modalContainer.outerHeight();
    var modalHeaderHeight = modalHeader.outerHeight();
    var modalFooterHeight = modalFooter.outerHeight();

    console.log("modalContainerHeight: ", modalContainerHeight);
    console.log("modalHeaderHeight: ", modalHeaderHeight);
    console.log("modalFooterHeight: ", modalFooterHeight);
    
    var offset = 80;
    
    var height = modalContainerHeight - (modalHeaderHeight + modalFooterHeight + offset);
    
    console.log('height: ',height);
    
    if(!isNaN(height)){
      height = height > 0 ? height: 20;
      if(type == 'short'){
        modalContent.css({'height': height + 'px'});
      }
      else{
        modalContainer.css({'height': '100%', 'overflow-y': 'hidden', 'margin-top': '40px'});
        modalContentContent.css({'height': '100%', 'overflow-y': 'auto'});
        modalContent.css({'overflow-y': 'visible'});
        modalFooter.css({'margin-bottom': '120px'});
      }
      setTimeout(function(){
        modalContent.css({'display': 'block'});
        var modalContentDOM = document.querySelector('#modal-content');
        modalContentDOM.scrollTop = 0;
      });
    }
    
  }
  
}
</script>
<!-- end Simple Custom CSS and JS -->
