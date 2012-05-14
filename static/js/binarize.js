var imageObj;

window.onload = function() {
    var canvas = document.getElementById("imview");
    var context = canvas.getContext("2d");
    imageObj = new Image();
    imageObj.onload = function() {
        context.drawImage(this, 0, 0);
    };
    imageObj.src = "/static/images/sombrero.jpg";
    $("#slider").slider({
                        animate: true,
                        min: 0,
                        max: 1,
                        orientation: "horizontal",
                        step: 0.025,
                        values: [0.5],
                        range: false,
                        change: function(event, ui) {binarize(ui.value)},
                        });
};

binarize = function(thresh) {
    var canvas = document.getElementById("imview");
    var context = canvas.getContext("2d");
    
    context.drawImage(imageObj, 0, 0);
    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i +=4) {
        var brightness = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
        
        data[i] = brightness;
        data[i + 1] = brightness;
        data[i + 2] = brightness;
        
        if (data[i] > (thresh * 255)) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
        } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
        }
    }
    
    context.putImageData(imageData, 0, 0);
}

readIMG = function(input) {
    if (input.files && input.files[0]) {
        var canvas = document.getElementById("imview");
        var context = canvas.getContext("2d");
        var imgprev = new Image();
        var reader = new FileReader();
        
        reader.onload = function (e) {
            imgprev.src = e.target.result;
            context.drawImage(imgprev, 0, 0);
        }
        reader.readAsDataURL(input.files[0]);
    }
}