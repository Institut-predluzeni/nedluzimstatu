/******* Do not edit this file *******
Simple Custom CSS and JS - by Silkypress.com
Saved: Jul 31 2021 | 09:17:26 */
document.addEventListener("DOMContentLoaded", function() {
  
  try {
    
    MicroModal.init({
      awaitCloseAnimation: true,// set to false, to remove close animation
      onShow: function(modal) {
        console.log("micromodal open");
      },
      onClose: function(modal) {
        console.log("micromodal close");
      }
    });
    
  } catch (e) {
    console.log("micromodal error: ", e);
  }
  
});