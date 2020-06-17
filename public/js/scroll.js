$('.accordion').on('shown.bs.collapse', function () { 
        
    $('html, body').animate({ 
        scrollTop: document.body.scrollHeight
    }, 600); 
        
});
