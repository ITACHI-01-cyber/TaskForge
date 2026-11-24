import { database } from './mongodb.js'
let index
export async function users() {
  const collection = (await database()).collection('users')
  index ??= collection.createIndex({loginKey:1}, {unique:true, partialFilterExpression:{loginKey:{$type:'string'}}}).catch(error => {
    index = undefined
    throw error
  })
  await index
  return collection
}
export const lookupLogin = key => ({$or:[{loginKey:key}, {_id:key, loginKey:{$exists:false}}]})
export const publicUser = ({_id, name, email, createdAt, profileImageUrl}) => ({
  accountId:_id, name, email, createdAt, profileImageUrl:profileImageUrl ?? '',
})