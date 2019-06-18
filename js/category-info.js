angular.module('app', [])
    .controller('gitHubDataController', ['$scope', '$http', '$window', function($scope, $http, $window) {

        var getCategoryInfo = function() {
            return $http.get("../categories/category_info.json", {
                    cache: true
                })
                .then(function (res) {
                    return res.data;
                });
        };

        var getReposTopics = function() {
            return $http.get("./explore/github-data/labRepos_Topics.json", {
                cache: true
            })
                .then(function(res){
                    return res.data;
                });
        };

        var getReposInfo = function() {
            return $http.get("./explore/github-data/labReposInfo.json", {
                cache: true
            })
                .then(function(res){
                    return res.data;
                });
        };

        var myDataPromise = getCategoryInfo();
        myDataPromise.then( function(catsObj) {
            $scope.cats = Object.keys(catsObj.data);
            $scope.catData = [];
            angular.forEach($scope.cats, function(value, key) {
                var data = catsObj["data"][value];
                $scope.catData.push(data);
            });

            var myRepoDataPromise = getReposTopics();
            myRepoDataPromise.then(function(reposObj){
                var allRepos = Object.keys(reposObj.data);
                $scope.topicRepos = [];
                angular.forEach(allRepos, function(value, key){
                    var repoData = reposObj["data"][value];
                    var topics = [];
                    var containsTopic = false;
                    for(var y in repoData.repositoryTopics.nodes){
                        topics.push(repoData.repositoryTopics.nodes[y].topic.name);
                        for (var z in $scope.catData){
                            if (repoData.repositoryTopics.nodes[y].topic.name== $scope.catData[z].topic){
                                containsTopic = true;
                            }
                        }
                    }
                    if(containsTopic){
                        $scope.topicRepos.push({"nameWithOwner" : value, "topics": topics});
                    }
                });

                var myRepoInfoPromise = getReposInfo();
                myRepoInfoPromise.then(function(reposInfoObj){
                    for (var i in reposInfoObj.data){
                        // console.log("repo name: "+ reposInfoObj.data[i].name);
                        for (var j in $scope.topicRepos){
                            if(reposInfoObj.data[i].nameWithOwner == $scope.topicRepos[j].nameWithOwner){
                                $scope.topicRepos[j]["name"]= reposInfoObj.data[i].name;
                                $scope.topicRepos[j]["gitUrl"]= reposInfoObj.data[i].url;
                                $scope.topicRepos[j]["homepageUrl"]= reposInfoObj.data[i].homepageUrl;
                            }
                        }
                    }
                });

                $scope.repoHref = function(nametag) {
                    $window.location.href = '../repo#'+nametag;
                };

            });

        });

        

       

    }]);
