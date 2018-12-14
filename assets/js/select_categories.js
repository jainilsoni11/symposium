//jQuery.noConflict();
$(window).on('load',function(){
    $('#myModal').modal('show'); 
});

function myfun(){
    location.href="home";
}

function buildlist(listName,labelName){
  var controls = document.getElementsByName(listName);
  var label = document.getElementsByName(labelName);
  label.value = '';
  for(var i=0;i<controls.length;i++){
      //console.log("inside buildlist");
      if(controls[i].checked){
          label.value += controls[i].value+' ,';
      }
  }
}

