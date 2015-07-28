var fs = require("fs")
    , q = require("q")
    , im = require("imagemagick")
    , cloudinary = require('cloudinary')


module.exports = function (db) {
    function Image() {
        this.ImageDB = db.collection("images");
        cloudinary.config({
            cloud_name: 'dhzzedkki',
            api_key: '147367432814122',
            api_secret: 'ovKcxYcm6oYzWoBUcAut9VSzHPY'
        });
    }

    Image.prototype.uploadToCloud = function (images) {
        var d = q.defer(),
            promises = [];
        images.forEach(function (item, index) {
            var promise = uploadToCloud(item);
            promises.push(promise);
        })
        q.all(promises).then(function (results) {
            d.resolve(results);
        });
        return d.promise;
    }

    var uploadToCloud = function (item) {
        var d = q.defer();
        cloudinary.uploader.upload(item.path,
            function (result) {
                /* result format
                 {
                 public_id: 'sample_spreadsheet.xls',
                 version: 1372279007,
                 signature: 'c56aabe3f9c7aefd3e50a877c2d17b3d381b5a53',
                 resource_type: 'raw',
                 created_at: '2013-06-23T14:55:21Z',
                 bytes: 6144,
                 type: 'upload',
                 url: 'http://res.cloudinary.com/demo/raw/upload/v1372279007/sample_spreadsheet.xls',
                 secure_url: 'https://res.cloudinary.com/demo/raw/upload/v1372279007/sample_spreadsheet.xls'
                 }
                 */
                d.resolve(result);
            }, {
                //public_id: 'cr4mxeqx5zb8rlakpfkg',
                //version: 1372275963,
                //signature: '63bfbca643baa9c86b7d2921d776628ac83a1b6e',
                width: 1024,
                exif: true
                //height: 576,
                //format: 'jpg',
                //resource_type: 'image',
                //created_at: '2013-06-26T19:46:03Z',
                //bytes: 120253,
                //type: 'upload',
                //url: 'http://res.cloudinary.com/demo/image/upload/v1372275963/cr4mxeqx5zb8rlakpfkg.jpg',
                //secure_url: 'https://res.cloudinary.com/demo/image/upload/v1372275963/cr4mxeqx5zb8rlakpfkg.jpg'
            });
        return d.promise;
    }

    Image.prototype.uploadToFS = function (gift, images, giftImageRootFolder) {
        var d = q.defer()
            , promises = []
            , fullsizeFolder = giftImageRootFolder + "/fullsize/"
            , thumbFolder = giftImageRootFolder + "/thumbs/";

        // when there is no image
        if (images.length) {
            if (!fs.existsSync(giftImageRootFolder)) {
                fs.mkdirSync(giftImageRootFolder);
            }

            //save images to local file system
            images.forEach(function (item, index) {
                var promise = resizeAndUpload(index, item, fullsizeFolder, thumbFolder);
                promises.push(promise);
            });
            q.all(promises).then(function (items) {
                console.log("all uploaded to fs");
                d.resolve(items);
            })
        }
        else {
            d.reject('no image');
        }
        return d.promise;
    }

    // upload the gift images thumbnails to mongo database as backup
    Image.prototype.uploadToDB = function (gift, giftImageRootFolder) {
        var _self = this
            , sourcePath
            , d = q.defer()
            , thumbFolder = giftImageRootFolder + "/thumbs/"
            , promise
            , promises = [];
        gift.images.forEach(function (image) {
            sourcePath = thumbFolder + image.name;
            promise = uploadToDB(image, sourcePath, gift, _self);
            promises.push(promise);
        })
        q.all(promises).then(function (results) {
            d.resolve(results);
        })
        return d.promise;
    };

    Image.prototype.deleteAll = function (images) {
        var d = q.defer();
        var imagesPublicIds = [];
        if (images && images.length) {
            for (var i = 0; i < images.length; i++) {
                var image = images[i];
                if (image.public_id)
                    imagesPublicIds.push(image.public_id);
            }

            console.log(imagesPublicIds)
            cloudinary.api.delete_resources(imagesPublicIds, function (result) {
                console.log("removed all images from cloudinary")
                d.resolve(result);
            });
        }
        else{
            console.log("nothing to remove")
            d.resolve(0);
        }
        return d.promise;
    }

    var deleteFromFSSync = function (path) {
        if (fs.existsSync(path)) {
            console.log('deleting from files');
            fs.readdirSync(path).forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) { // recurse
                    deleteFromFSSync(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };

    var uploadToDB = function (image, sourcePath, gift, _self) {
        var d = q.defer();
        if (image && fs.existsSync(sourcePath)) {
            var fileData = fs.readFileSync(sourcePath);
            _self.ImageDB.insert({giftId: gift._id, name: image.name, schema: image.schema, data: fileData},
                function (e, insertedImage) {
                    if (insertedImage) {
                        q.resolve(insertedImage);
                        //insertedGift.images.push({id: imageResult[0]._id, name: imageName});
                    }
                    else {
                        q.reject(e);
                    }
                }
            );
        }
        return d.promise;
    }

    var resizeAndUpload = function (index, item, fullsizeFolder, thumbFolder) {
        //if image does not exist, express keeps a object of image even when there is no image exists
        //when there is no image, the itam does not have a name or size
        var d = q.defer();
        var fullsizePath
            , thumbPath
            , fileData
            , imageName = index + "_" + item.name;

        fileData = fs.readFileSync(item.path);
        if (fileData) {
            //upload images to individual gift folder directory
            //TODO: check image size before upload to database;

            //check directory existence
            if (!fs.existsSync(fullsizeFolder)) {
                fs.mkdirSync(fullsizeFolder);
            }

            if (!fs.existsSync(thumbFolder)) {
                fs.mkdirSync(thumbFolder);
            }

            //upload file to the full size folder and resize to a thumb folder
            //added index to avoid naming conflict
            fullsizePath = fullsizeFolder + imageName;
            thumbPath = thumbFolder + imageName;
            fs.writeFileSync(fullsizePath, fileData);
            //resize image
            im.resize(
                {
                    srcPath: fullsizePath,
                    dstPath: thumbPath,
                    width: 400
                },
                function (err, stdout, stderr) {
                    if (err) {
                        d.reject(err);
                    }
                    else {
                        console.log("resized");
                        d.resolve({name: imageName, schema: item});
                    }
                });
        }
        else {
            d.reject("no file exists");
        }
        return d.promise;
    }

    return new Image();
}

