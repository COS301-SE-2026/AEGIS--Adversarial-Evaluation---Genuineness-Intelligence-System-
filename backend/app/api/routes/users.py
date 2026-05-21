from fastapi import APIRouter

router = APIRouter()

# User-related endpoints go here, no logic here just API definitions.
# Examples: register user, login user, get user profile


@router.get("/")
def get_users():
    # placeholder endpoint
    return {"message": "Users route working"}
