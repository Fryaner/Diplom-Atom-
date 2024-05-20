import mainApi from '../../../store/mainApi';
import { UserModel } from '../../../models/userModel';
import { RegisterModel } from '../../../models/registerModel';

const registerApi = mainApi.injectEndpoints({
    endpoints: (build) => ({
        getAllUsers: build.query<UserModel[], void>({
            query: () => 'user'
        }),
        addUser: build.mutation<RegisterModel, UserModel>({
            query: (body) => ({
                url: 'user/registration',
                method: 'POST',
                body: body,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            })
        })
    }),
})

export const { 
    useGetAllUsersQuery, 
    useAddUserMutation 
} = registerApi;