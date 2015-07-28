giftuuApp.directive('selectImage', function ($parse) {
    return function (scope, elem, attrs) {
        scope.selectedInputs = [0];
        scope.selectedImages = [];
        scope.fileNameChaged = function (files) {
            if (files) {
                for (var i = 0, f; f = files[i]; i++) {
                    if (!f.type.match('image.*')) {
                        continue;
                    }
                    var reader = new FileReader();
                    reader.onload = (function () {
                        return function (e) {
                            scope.$apply(function(){
                                scope.selectedInputs.push(scope.selectedInputs.length+1);
                                scope.selectedImages.push({src:e.target.result});
                            })
                        };
                    })(f);
                    reader.readAsDataURL(f);
                }
            }
        }
        scope.removeItem = function(index){
            scope.selectedImages.splice(index,1);
            scope.selectedInputs.splice(index,1);
        }
    };
});