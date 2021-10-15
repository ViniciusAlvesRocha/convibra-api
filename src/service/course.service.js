let Course = require('../model/course.model')
let sha1 = require('sha1');

async function getListing(condition){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try{

        let pageNumber = 1;
        let limit = null;
        let queryCondition = {}

        if(condition.pagination != undefined)
        {
            if(condition.pagination.limit != undefined)
            {
                limit = condition.pagination.limit;
            }

            if(condition.pagination.pageNumber != undefined)
            {
                pageNumber = condition.pagination.pageNumber;
            }
        }

        if(condition.query != undefined)
        {
            if(condition.query.filter != undefined){

                queryCondition = condition.query.filter;
            }
        }

        if(queryCondition.subAccountAdminID == false){
            _response["status"] = "failure";
            _response["message"] = 'Unable to get course data';
            return _response;    
        }

        pageNumber = pageNumber - 1;
        let skip = pageNumber * limit;
        
        if(limit == -1)
        {
            skip = null;
            limit = null;
        }

        // console.log('queryCondition',queryCondition);

        // return;
        
        var _courseData = await Course.find(queryCondition)
                               .skip(parseInt(skip))
                               .limit(parseInt(limit));
        
        let count = await Course.countDocuments(queryCondition);

        if(_courseData.length <= 0)
        {
            let response = {
                'courseData': [],
                'count': count
            }

            _response["status"] = "failure";
            _response["message"] = "No Course data found.";
            _response["data"] = response;
        }
        else
        {
            let response = {
                'courseData': _courseData,
                'count': count
            }

            _response["status"] = "success";
            _response["message"] = "Course data get successfully";
            _response["data"] = response;
        }
        
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function getDetails(_subAccountAdminID,_courseId){
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try{

        var condition = {   
                            _id: _courseId, 
                            subAccountAdminID:_subAccountAdminID
                        };
    
        var data = await Course.findOne(condition);

        if(data == null){
            _response['status'] = 'failure';
            _response['message'] = 'Unable to get course details';
            return _response;
        }

        _response["status"] = "success";
        _response["message"] = "Course details get successfully";
        _response["data"] = data;
    }
    catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function storeCourse(_data, _currentUserId){
    
    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try{

        let checksum = sha1((""+_data.nameLang1 + "::" + _data.nameLang2+"").toUpperCase());

        let checkExistance = await Course.findOne({checksum:checksum, subAccountAdminID: _currentUserId});

        if(checkExistance != null){
            _response['status']  = 'failure';
            _response['message'] = 'Course already existed';
            return _response;
        }

        let inputData = {
            subAccountAdminID:_currentUserId,
            nameLang1:_data.nameLang1,
            nameLang2:_data.nameLang2,
            checksum:checksum
        };

        let storeCourse = new Course(inputData);
        let savedCourse = await storeCourse.save();

        _response["status"]  = "success";
        _response["message"] = "Course data stored successfully";
        _response['data']    = savedCourse;

    }catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function updateCourse(_data, _currentUserId, _courseId){

    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try{
        
        let _course = await Course.findOne({_id:_courseId});

        let newChecksum = sha1((""+_data.nameLang1 + "::" + _data.nameLang2+"").toUpperCase());
        
        if(_course.checksum != newChecksum){
            let existingCourse = await Course.findOne({ checksum: newChecksum, subAccountAdminID:_currentUserId });
            if (existingCourse != null) {
                _response['status'] = "failure";
                _response['message'] = "Course already exists";
                return _response;
            }
        }

        let inputData = {
            nameLang1:_data.nameLang1,
            nameLang2:_data.nameLang2,
            checksum:newChecksum
        };

        await Course.updateOne({ _id: _courseId }, inputData);
        _response["status"] = "success";
        _response["message"] = "Course data updated successfully";

    }catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }

    return _response;
}

async function deleteCourse(_courseId){

    let _response = {
        "status" : "",
        "data" : {},
        "message" : ""
    };

    try{

        var data = await Course.remove({_id: _courseId});

        _response["status"] = "success";
        _response["message"] = "Course data deleted successfully";


    }catch(e){
        _response["status"] = "failure";
        _response["message"] = e.message;
    }
    return _response;
}

module.exports = {
    getListing:getListing,
    getDetails:getDetails,
    storeCourse:storeCourse,
    updateCourse:updateCourse,
    deleteCourse:deleteCourse
}