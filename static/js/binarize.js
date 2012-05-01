$(document).ready (function() {

    var originalImageSrc = $("img").attr("src");
    $("#selections").change(function() {
        // change sliders depending on option selected
        var value = $("#selections option:selected").val();
        var node = $("#sliders");
        node.hide();
        node.children().remove();
        if (value =="sel") {
            // "Make a selection" option - show original image
            $("img").attr("src", originalImageSrc);
        } else if (value == "sauvola") {
            // show default image
            $("img").attr("src", originalImageSrc);
            // create sliders (hidden) with gamera default values
            var s1 = newSliderDiv("regionSize");
            var l1 = newLabel("Region size:");
            createSlider(s1, 1, 50, 1, [15], false, function() {processImage(originalImageSrc)});
            var s2 = newSliderDiv("sensitivity");
            var l2 = newLabel("Sensitivity:");
            createSlider(s2, 0, 1, 0.1, [0.5], false, function() {processImage(originalImageSrc)});
            var s3 = newSliderDiv("dynamicRange");
            var l3 = newLabel("Dynamic range:");
            createSlider(s3, 1, 225, 1, [128], false, function() {processImage(originalImageSrc)});
            var s4 = newSliderDiv("bounds");
            var l4 = newLabel("Lower and upper bounds:");
            createSlider(s4, 0, 255, 1, [20, 150], true, function() {processImage(originalImageSrc)});
            node.append(l1, s1, l2, s2, l3, s3, l4, s4);
            // show sliders and binarize image with default parameters
            node.slideDown("fast", function() {
                processImage(originalImageSrc);
            });
        } else if (value == "niblack") {
            $("img").attr("src", originalImageSrc);
            var s1 = newSliderDiv("regionSize");
            var l1 = newLabel("Region size:");
            createSlider(s1, 1, 50, 1, [15], false, function() {processImage(originalImageSrc)});
            var s2 = newSliderDiv("sensitivity");
            var l2 = newLabel("Sensitivity:");
            createSlider(s2, -1, 1, 0.1, [-0.2], false, function() {processImage(originalImageSrc)});
            var s3 = newSliderDiv("bounds");
            var l3 = newLabel("Lower and upper bounds:");
            createSlider(s3, 0, 255, 1, [20, 150], true, function() {processImage(originalImageSrc)});
            node.append(l1, s1, l2, s2, l3, s3);
            node.slideDown("fast", function() {
                processImage(originalImageSrc);
            });
        } else {
            console.log(value);
        }
    });
    
});

createSlider = function(mySliderDiv, myMin, myMax, myStep, myValues, myRange, myFunction) {
    // creates a jQuery slider using parameters passed in
    mySliderDiv.slider({
        min: myMin,
        max: myMax,
        step: myStep,
        values: myValues,
        range: myRange,
        change: myFunction,
    });
}

processImage = function(imgSrc) {
    // puts data into object and send it as ajax request. 
    var data = {}
    data["selected"] = $("#selections option:selected").val();
    data["filen"] = imgSrc;
    $(".ui-slider").each(function() {
        data[$(this).attr("id")] = $(this).slider("values");
    });
    $.get("binarize", {"data": JSON.stringify(data)}, function(newSrc) {
        $("img").attr("src", newSrc)
    });
}

newSliderDiv = function(sliderId) {
    var d = $("<div>");
    d.attr({id:sliderId});
    return d
}

newLabel = function(label) {
    var l = $("<label>");
    l.text(label);
    return l
    
}
