pragma solidity ^0.5.0;

contract RecipientContract{
    
    /*struct courseDetails
    {
        string accountId;
        uint256 courseId;
        string courseName;
        string convocationDate;
        string result;
        bool status;
        string batch; 
    }*/
    address public owner;
    
    constructor () public{
        owner = msg.sender;
    }
    
    modifier onlyOwner{
       require(msg.sender == owner,"Caller must be contract owner");
       _;
    }
    
    
    struct recipientDetails
    {
        address ethAddress;
        uint256 recipientId;
        string nationalId;
        string firstName;
        string lastName;
        string  email;
        string  Address;
        string mobileNo;
        mapping (address => string) courses; /* json formatted string*/
        address[] courseList;
    }
    
    mapping(address => recipientDetails) RecipientDetails;
    

    /*store log RecipientDetails*/
    event RecipientSet(
                        address indexed ethAddress,
                        uint256 indexed recipientId, 
                        string nationalId, 
                        string firstName, 
                        string lastName,
                        string email,
                        string Address,
                        string mobileNo
                        );
    
    /*update log RecipientDetails*/
    event RecipientUpdate(
                        address indexed ethAddress,
                        uint256 indexed recipientId, 
                        string nationalId, 
                        string firstName, 
                        string lastName,
                        string email,
                        string Address,
                        string mobileNo
                        );
    
    /*store log CourseDetails*/
    
    event CourseSet(address _recipientUniqAddress, string _courseId, address tempCourseEncodeAddress, string _jsonData);
    
    
    /*function for store Recipient Information on blockchain*/
    function setRecipientDetail(
                            address _ethAddress,
                            uint256 _recipientId,       
                            string memory _nationalId,
                            string memory _firstName,
                            string memory _lastName,
                            string memory _email,
                            string memory _Address,
                            string memory _mobileNo
                            ) public onlyOwner
    {
        // address tempAddress = address(uint(keccak256(abi.encodePacked(msg.sender,now))));  
        
        RecipientDetails[_ethAddress].recipientId  = _recipientId;
        RecipientDetails[_ethAddress].nationalId   = _nationalId;
        RecipientDetails[_ethAddress].firstName    = _firstName;
        RecipientDetails[_ethAddress].lastName     = _lastName;
        RecipientDetails[_ethAddress].email        = _email;
        RecipientDetails[_ethAddress].Address      = _Address;
        RecipientDetails[_ethAddress].mobileNo     = _mobileNo;
        
        emit RecipientSet(_ethAddress,_recipientId,_nationalId,_firstName,_lastName,_email,_Address,_mobileNo);
                                
    }
    
    /*function for Get Recipient Information from Recipient ID*/
     function getRecipientDetail(address recipientUniqAddress) public view returns(
                                                                uint256 recipientId,
                                                                string memory nationalId,
                                                                string memory firstName,
                                                                string memory lastName,
                                                                string memory email,
                                                                string memory Address,
                                                                string memory mobileNo
                                                                //address[] memory courseList
                                                                )
    {
         return (RecipientDetails[recipientUniqAddress].recipientId,
                 RecipientDetails[recipientUniqAddress].nationalId,
                 RecipientDetails[recipientUniqAddress].firstName,
                 RecipientDetails[recipientUniqAddress].lastName,
                 RecipientDetails[recipientUniqAddress].email,
                 RecipientDetails[recipientUniqAddress].Address,
                 RecipientDetails[recipientUniqAddress].mobileNo
                );
    }
    
    /*function for Update Recipient Information*/
    function updateRecipientDetail(address _recipientUniqAddress, 
                                    uint256 _recipientId,
                                    string memory _nationalId, 
                                    string memory _firstName,
                                    string memory _lastName,
                                    string memory _email,
                                    string memory _Address,
                                    string memory _mobileNo
                                ) public onlyOwner
    {
        RecipientDetails[_recipientUniqAddress].recipientId = _recipientId;
        RecipientDetails[_recipientUniqAddress].nationalId = _nationalId;
        RecipientDetails[_recipientUniqAddress].firstName = _firstName;
        RecipientDetails[_recipientUniqAddress].lastName = _lastName;
        RecipientDetails[_recipientUniqAddress].email = _email;
        RecipientDetails[_recipientUniqAddress].Address = _Address;
        RecipientDetails[_recipientUniqAddress].mobileNo = _mobileNo;

        emit RecipientUpdate(_recipientUniqAddress,_recipientId,_nationalId,_firstName,_lastName,_email,_Address,_mobileNo);
    }
    
    /*function for store Course Information on blockchain*/
    function setCourseDetail(
                                address _recipientUniqAddress,
                                string memory _courseId,
                                string memory _jsonData
                            ) public onlyOwner
    {
        address tempAddress = address(uint(keccak256(abi.encodePacked(_courseId))));  
        
        /*store into course mapping*/
        RecipientDetails[_recipientUniqAddress].courses[tempAddress] = _jsonData;
        
        /*store into courseList array*/
        RecipientDetails[_recipientUniqAddress].courseList.push(tempAddress);
       
        emit CourseSet(_recipientUniqAddress,_courseId,tempAddress,_jsonData);
                                
    }
    
    /*function get recipient coursess*/
    function getRecipientCoursesId(address recipientEthAddress) public view returns (address[] memory)
    {
        return RecipientDetails[recipientEthAddress].courseList;
    }
    
    /*function get json data from courseEncodedID*/
    function getRecipientCourses(address recipientUniqAddress,address recipientCourseId) public view returns (string memory json)
    {
        return RecipientDetails[recipientUniqAddress].courses[recipientCourseId];
    }
    
}