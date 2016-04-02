app.controller('AccountEditController', function($scope, FireRef, $stateParams, $firebaseArray, $timeout, $state) {

    var projectKey = $stateParams.projectKey;
    var projectRef = FireRef.child($stateParams.projectKey);

    // Check if project exists, else go to my-projects
    projectRef.once("value", function(snapshot) {
        var projectKey = snapshot.exists();
        if (projectKey === false) {
            $state.go("account.myprojects");
        }
    });

    // Base ref for project
    var FireProjectRef = FireRef.child(projectKey);

    // Firebase references
    var projectCategoryRef = FireProjectRef.child("categories");
    var projectCategoryItemsRef = FireProjectRef.child("categoryItems");
    var projectItemOptionsRef = FireProjectRef.child("itemOptions");

    // Get as firebaseArray
    var projectCategoryArray = $firebaseArray(FireProjectRef.child("categories"));

    // Starting $scope variables
    $scope.oneAtATime = true;
    $scope.categories = projectCategoryArray;
    $scope.loddar = true;

    $scope.modalAddCategory = false;
    $scope.modalAddItem = false;

    $scope.optionImages = [];

    // Toggle modal
    $scope.toggleModal = function(modal, key) {
        if (modal === "category") {
            $scope.modalAddCategory = !$scope.modalAddCategory;
        }
        if (modal === "item") {
            $scope.modalAddItem = !$scope.modalAddItem;
            $scope.addItemKey = key;
        }
    };

    // Add category
    $scope.addCategory = function (data) {
        projectCategoryRef.push({
            title: data.title
        });
        // Hide modal
        $scope.modalAddCategory = false;
    };

   // Adds a category to the project
    $scope.addItem = function (data) {
        var id = $scope.addItemKey;
        var categoryItemsRef = projectCategoryItemsRef.push();
        var categoryItemsKey = categoryItemsRef.key();
        // Add reference key to category and data to categoryItems node
        categoryItemsRef.set({title: data.title, key: categoryItemsKey});
        projectCategoryRef.child(id).child("refs").child(categoryItemsKey).set(categoryItemsKey);
        // Hide modal
        $scope.modalAddItem = false;
    };

    // Adds an option to an item
    $scope.addOption = function (id) {
        var data = prompt("Ange något");
        var itemOptionsRef = projectItemOptionsRef.push();
        var itemOptionsKey = itemOptionsRef.key();

        // Add reference key to category and data to categoryItems node
        itemOptionsRef.set({
            title: data,
            key: itemOptionsKey,
            price: 0,
            default: false,
            desc: '',
            active: true,
            PrimaryImg: 0,
            Images: $scope.optionImages
        });
        projectCategoryItemsRef.child(id).child("refs").child(itemOptionsKey).set(itemOptionsKey);
    };


    // Uploads image

    $scope.imageUpload = function(element){
        var reader = new FileReader();
        reader.onload = $scope.imageIsLoaded;
        reader.readAsDataURL(element.files[0]);
    };

    //
    $scope.imageIsLoaded = function(e){
        $scope.$apply(function() {
            $scope.optionImages.push(e.target.result);
        });
    };

    $scope.deleteOptionImg = function(index, item) {
        var myRef = projectItemOptionsRef.child(item.key);
        myRef.remove();
    };

    $scope.makePrimaryImg = function(index, item) {
        var myRef = projectItemOptionsRef.child(item.key);
        myRef.update({PrimaryImg: index});
    };

    // Enter category item
    $scope.enterCategoryItem = function(item, categoryName) {
        var ref = projectCategoryItemsRef.child(item.key);
        ref.on("value", function(snapshot) {
            $scope.selectedItem = snapshot.val();
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
        });

        $scope.getOptions(item, categoryName);
    };

    // Gets the items in a category
    $scope.getItems = function(key) {
        // Store data as object and use in scope
        $scope.categoryItems = {};

        // Get all category item keys
        var categoryKeyRefs = FireProjectRef.child("categories").child(key).child("refs");

        // Iterate through all keys from "categoryKeyRefs" and get data from "projectCategoryItemsRef"
        categoryKeyRefs.on('child_added', function(snapshot) {
            var itemKey = snapshot.key();
            projectCategoryItemsRef.child(itemKey).on('value', function(snapshot) {
                $timeout(function() {
                    if( snapshot.val() === null ) {
                        delete $scope.categoryItems[itemKey];
                    }
                    else {
                        $scope.categoryItems[itemKey] = snapshot.val();
                    }
                });
            });
        });
    };

    // Get the options for an item
    $scope.getOptions = function(item, categoryName) {
        // Store data as object and use in scope
        $scope.imgCategory = categoryName;
        $scope.imgItem = item.title;
        $scope.itemOptions = {};

        // Get all category item keys
        var categoryItemKeyRefs = FireProjectRef.child("categoryItems").child(item.key).child("refs");

        // Iterate through all keys from "categoryKeyRefs" and get data from "projectCategoryItemsRef"
        categoryItemKeyRefs.on('child_added', function(snapshot) {
            var itemKey = snapshot.key();
            projectItemOptionsRef.child(itemKey).on('value', function(snapshot) {
                $timeout(function() {
                    if( snapshot.val() === null ) {
                        delete $scope.itemOptions[itemKey];
                    }
                    else {
                        $scope.itemOptions[itemKey] = snapshot.val();
                    }
                });
            });
        });
    };

    // Save option item
    $scope.saveOptionItem = function(item) {
        var myRef = projectItemOptionsRef.child(item.key);
        myRef.update({
            title: item.title,
            price: item.price,
            default: item.default,
            desc: item.desc,
            active: item.active,
            PrimaryImg: 0,
            Images: $scope.optionImages
        }, onComplete());

        function onComplete() {
            console.log("complete");
        };
    }

});