var str;

    

$("form").on("keyup","#searchbox",function(e){
    var html=""
    

       
    
    
    
    str= $("#searchbox").val();
    var url= "/search/courses/?q="+str
    e.preventDefault();
    
    $.ajax({
        url:url,
        data:str,
        type:"GET",
        success:function(data){
            
            
        if(data){        
       $("#suggestions").css("display","block")     
             html=""
            var link;        
            
            
            
                    Object.keys(data).forEach(function(key){
                        
                        link='<p><a href="courses/' + data[key].id  +'">' 
                        html+= link+ data[key].course_name +"</a></p>"
                    $("#suggestions").html(html)
                    
                    
                    
                        
                        
                    })
            
            
                 
                    
                    
                    
                    
        }
                
                
                
                
                
                
    //         if($("#searchbox")==""){
    // $("suggestions").html("") }       
                 
                
             
            
                    
            
        },
        
  error: function (request, status, error) {
      
       $("#suggestions").html(
                    `
                    <p>No Matches found</p>
                    
                    `
                    
                    )
        
    }
        
        
    })
    
    
    
    
})
    
$("#formmain").on("focusout","#searchbox",function(e){
    
    e.stopPropagation();
    
    setTimeout(hidestuff,1000)
    
    function hidestuff(){
    $("#suggestions").css("display","none")
    $("#suggestions").html("")
    }
    
})