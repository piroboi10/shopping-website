var app = angular.module('myApp',["ui.router","ngToast","textAngular"]);

app.run(function($rootScope,AuthService,$state,$transitions){
   $transitions.onStart({},function(transition){
       if(transition.$to().self.authenticate == true){
           AuthService.isAuthenticated()
           .then(function(res){
               console.log(res);
               if(res == false)
                $state.go('login');
           });
       }
   });
});
app.config(function($stateProvider,$urlRouterProvider,$locationProvider){
    Stamplay.init("argblogit");
    $locationProvider.hashPrefix('');
    //localStorage.removeItem('https://blogit-uncommoner.c9users.io-jwt');
    $urlRouterProvider.otherwise('/');
    $stateProvider
    .state('home',{
        url : '/',
        templateUrl : 'templates/home.html',
        controller : "HomeCtrl"
    })
    .state('login',{
        url : '/login',
        templateUrl : 'templates/login.html',
        controller : "LoginCtrl"
    })
    .state('signup',{
        url : '/signup',
        templateUrl : 'templates/signup.html',
        controller : "SignUpCtrl"
    })
    .state('myblogs',{
       url : '/myblogs',
       templateUrl : 'templates/myblogs.html',
       controller : 'MyBlogsCtrl',
       authenticate : true
    })
    .state('edit',{
        url: '/edit/:id',
        templateUrl:'templates/edit.html',
        controller:'EditCtrl',
        authenticate : true
    })
    .state('view',{
        url:'/view/:id',
        templateUrl:'templates/view.html',
        controller:'ViewCtrl'
    })
    .state('create',{
        url: '/create',
        templateUrl : 'templates/create.html', 
        controller : 'CreateCtrl',
        authenticate : true
    });
});

app.factory('AuthService',function($q,$rootScope){
    return{
        isAuthenticated : function(){
            var defer = $q.defer();
            Stamplay.User.currentUser(function(err,res){
                if(err){
                    defer.resolve(false);
                    $rootScope.loggedIn = false;
                }
                if(res.user){
                    defer.resolve(true);
                    $rootScope.loggedIn = true;
                }
                else{
                    defer.resolve(false);
                    $rootScope.loggedIn = false;
                }
            });
            return defer.promise;
        }
    }
});
app.filter('htmlToPlainText',function(){
    return function(text){
        return text ? String(text).replace(/<[^>]+>/gm, '') : '';
    }
    
})

app.controller('ViewCtrl',function($scope,$state,$stateParams,$timeout,ngToast){
  Stamplay.Object("blogs").get({_id:$stateParams.id})
  .then(function(res){
      $scope.blog=res.data[0];
      $scope.upVoteCount = $scope.blog.actions.votes.users_upvote.length;
      $scope.downVoteCount = $scope.blog.actions.votes.users_downvote.length;
      $scope.$apply();
      console.log(res);
  },function(err){
      console.log(err);
  });
  
  $scope.postComment = function(){
      Stamplay.Object("blogs").comment($stateParams.id,$scope.comment)
      .then(function(res){
          console.log(res);
          $scope.blog=res;
          $scope.comment="";
          $scope.$apply();
      }, function(err){
          if(err.code == 403){
              console.log("login first.");
              $timeout(function(){ngToast.create('<a href="#/login" class="">Please login before posting comments.</a>');})
          }
      });
  }
  
  $scope.upVote=function(){
      Stamplay.Object("blogs").upVote($stateParams.id)
      .then(function(res){
          console.log(res);
          $scope.blog = res;
          $scope.comment="";
          $scope.upVoteCount = $scope.blog.actions.votes.users_upvote.length;
          $scope.downVoteCount = $scope.blog.actions.votes.users_downvote.length;
          $scope.$apply();
      },function(err){
          console.log(err);
          if(err.code==403){
              console.log("login first");
              $timeout(function(){ngToast.create('<a href="#/login" class="">Please login before posting comments.</a>');})
          }
          if(err.code==406){
              console.log("already voted");
              $timeout(function(){ngToast.create("You have already voted once.");});
          }
      });
  }
  
   $scope.downVote=function(){
      Stamplay.Object("blogs").downVote($stateParams.id)
      .then(function(res){
          console.log(res);
          $scope.blog = res;
          $scope.comment="";
          $scope.upVoteCount = $scope.blog.actions.votes.users_upvote.length;
          $scope.downVoteCount = $scope.blog.actions.votes.users_downvote.length;
          $scope.$apply();
      },function(err){
          console.log(err);
          if(err.code==403){
              console.log("login first");
              $timeout(function(){ngToast.create('<a href="#/login" class="">Please login before posting comments.</a>');})
          }
          if(err.code==406){
              console.log("already voted");
              $timeout(function(){ngToast.create("You have already voted once.");});
          }
      });
  }
});

app.controller('EditCtrl',function($scope,taOptions,$state,$stateParams,$timeout,ngToast){
    $scope.Post={};
    taOptions.toolbar = [
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
  ];
  
  Stamplay.Object("blogs").get({_id:$stateParams.id})
  .then(function(res){
      console.log(res);
      $scope.Post = res.data[0];
      $scope.$apply();
      console.log($scope.Post);
  },function(err){
      console.log(err);
  });
  
  $scope.update = function(){
      Stamplay.User.currentUser()
      .then(function(res){
          if(res.user){
              if(res.user._id == $scope.Post.owner){
                  Stamplay.Object("blogs").update($stateParams.id,$scope.Post)
                  .then(function(res1){
                      console.log(res1);
                      $state.go('myblogs');
                      ngToast.create("Updated Successfully.")
                      console.log("success");
                  },function(err1){
                      console.log(err1);
                  });
              }
          else
            $state.go('login');
          }
          else
            $state.go('login');
      },function(err){
          console.log(err);
      });
  }
});
app.controller('CreateCtrl',function($scope,taOptions,$state,ngToast,$timeout){
    $scope.newPost={};
    taOptions.toolbar = [
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
  ];
  $scope.create = function(){
      Stamplay.User.currentUser()
      .then(function(res){
          if(res.user){
              console.log(res);
              Stamplay.Object("blogs").save($scope.newPost)
              .then(function(res1){
                  if(res1){
                    $timeout(function(){ngToast.create("Post Published Successfully.");});
                    console.log(res1.title+" "+res1.content);
                  }
              },function(err1){
                   $timeout(function(){ngToast.create("Something went wrong. Please try again later.");});
                   console.log(err1);
              });
          }
          else{
              $state.go('login');
              $timeout(function(){ngToast.create("Please Login First.");});
          }
      },function(err){
          $timeout(function(){ngToast.create("Something went wrong. Please try again later.");});
          console.log(err);
      });
  }
});
app.controller('MainCtrl',function($scope,$rootScope,$timeout,ngToast){
    $scope.logout = function(){
            localStorage.removeItem('https://blogit-uncommoner.c9users.io-jwt');
            console.log("Logged Out!");
            $timeout(function(){ngToast.create("You are now Logged out.")});
            $timeout(function(){
                $rootScope.loggedIn = false;
                console.log("false");
            });
    }
  /*  $scope.logout = function(){
            Stamplay.User.logout(true,function(){
                console.log("Logged Out!");
                $timeout(function(){
                $rootScope.loggedIn = false;
                console.log("false");
                },0);
            });
    }*/
});
app.controller('HomeCtrl',function($scope){
    Stamplay.Object("blogs").get({sort : "-dt_create"})
    .then(function(res){
        $scope.latestBlogs = res.data;
        $scope.$apply();
        console.log($scope.latestBlogs);
    },function(err){
        console.log(err);
    })
});


app.controller('LoginCtrl',function($scope,$state,$timeout,$rootScope,ngToast){
    $scope.user={}
    $scope.login=function(){
        Stamplay.User.currentUser()
            .then(function(res){
            if(res.user){
                ngToast.create("You are already Logged in.");
                $rootScope.loggedIn = true;
                $rootScope.displayName = res.user.firstName+" "+res.user.lastName;
                $timeout(function(){
                    $state.go('myblogs');
                },0);
                console.log("already logged in");
            }
            else{
                Stamplay.User.login($scope.user)
                .then(function(res1){
                    console.log(res1);
                    $timeout(function(){ngToast.create("You are now logged in.");});
                    $rootScope.loggedIn=true;
                    $rootScope.displayName = res1.firstName+" "+res1.lastName;
                    $timeout(function(){
                        $state.go('myblogs');
                    });
                },function(err){
                    $rootScope.loggedIn = false;
                    console.log(err);
                    $timeout(function(){ngToast.create("Something went wrong.Please try again later.");});
                });
            }
        },function(err){
            console.log(err);
        });
    }
});

app.controller('SignUpCtrl',function($scope,ngToast,$timeout){
    $scope.newUser={};
    $scope.signup = function(){
        $scope.newUser.displayName = $scope.newUser.firstName+" "+$scope.newUser.lastName;
        if($scope.newUser.firstName && $scope.newUser.lastName && $scope.newUser.email && $scope.newUser.password && $scope.newUser.confirmPassword) {
            console.log("All Fields Are Valid!");
            
            if($scope.newUser.password == $scope.newUser.confirmPassword){
                console.log("All Set Let's Signup!");
                Stamplay.User.signup($scope.newUser)
                .then(function(response){
                    console.log(response);
                    $timeout(function(){ngToast.create("Your Account has been successfully created. Please login!");});
                    console.log("Success");
                    localStorage.removeItem('https://blogit-uncommoner.c9users.io-jwt');
                },function(error){
                    $timeout(function(){ngToast.create("Something went wrong.Please try again later.");});
                    console.log(error);
                });
            }
            else{
                console.log("Passwords Do Not Match");
                $timeout(function(){ngToast.create("Passwords do not match!");});
            }
        }
        else{
            console.log("Some Fields Are Invalid!");
        }
        
    }
});

app.controller('MyBlogsCtrl',function($scope,$state){
    Stamplay.User.currentUser().then(function(res){
        if(res.user){    
        Stamplay.Object('blogs').get({owner: res.user._id, sort:"-dt_create"})
        .then(function(res){
            console.log(res);
            $scope.userBlogs = res.data;
            $scope.$apply();
            console.log($scope.userBlogs);
        },function(err){
            console.log(err);
        });
        }
        else
            $state.go('login')
    },function(err){
        console.log(err);
    });
});