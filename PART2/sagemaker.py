from sklearn.model_selection import train_test_split
import pandas as pd
import numpy as np
import seaborn as sns
import sagemaker
from sagemaker.amazon.amazon_estimator import RecordSet
import boto3
from sklearn.preprocessing import LabelEncoder
from sklearn import preprocessing
from sagemaker.amazon.amazon_estimator import get_image_uri
from sagemaker import get_execution_role
import io
import os
import sagemaker.amazon.common as smac
from sagemaker.predictor import csv_serializer, json_deserializer

# file2 = pd.read_csv('FILE_2.csv', delimiter = ',', dtype = 'string')
file2 = pd.read_csv('FILE_2.csv', delimiter = ',')
file1 = pd.read_csv('FILE_1.csv', delimiter = ',', usecols = ['Rating', 'Cuisine', 'NumberOfReviews'])
# print file2.Cuisine

le = preprocessing.LabelEncoder()
le.fit(["indian", "japanese", "italian", "mexican", "chinese", "thai"])
list(le.classes_)
file2_cuisine = file2.Cuisine
file2_cuisine = le.transform(file2_cuisine)
file2['Cuisine'] = file2_cuisine

file1_cuisine = le.transform(file1.Cuisine)
file1['Cuisine'] = file1_cuisine
features, lables = file2.iloc[:, [1, 2, 3]].astype('float32'), file2.iloc[:, 4].astype('float32')
# features, lables = file2.iloc[:, [0, 1, 2, 3]], file2.iloc[:, 4].astype(int)
features = np.array(features)
labels = np.array(lables)

container = get_image_uri(boto3.Session().region_name, 'linear-learner')
role = get_execution_role()
bucket = 'sagemakercchw2'
# prefix = 'sagemaker/DEMO'
output_location = 's3://{}'.format(bucket)
print('training artifacts will be uploaded to: {}'.format(output_location))

buf = io.BytesIO()
smac.write_numpy_to_dense_tensor(buf, features, labels)
buf.seek(0)
key = 'file2'
boto3.resource('s3').Bucket(bucket).Object(os.path.join('train', key)).upload_fileobj(buf)
s3_train_data = 's3://{}/train/{}'.format(bucket, key)
print('uploaded training data location: {}'.format(s3_train_data))

sess = sagemaker.Session()
linear = sagemaker.estimator.Estimator(container,
                                       role, 
                                       train_instance_count = 1, 
                                       train_instance_type = 'ml.m4.xlarge',
                                       output_path = output_location,
                                       sagemaker_session = sess)

linear.set_hyperparameters(feature_dim = 3,
                           predictor_type = 'binary_classifier',
                           mini_batch_size = 50)

linear.fit({'train': s3_train_data})

linear_predictor = linear.deploy(initial_instance_count=1,
                                 instance_type='ml.m4.xlarge')

linear_predictor.content_type = 'text/csv'
linear_predictor.serializer = csv_serializer
linear_predictor.deserializer = json_deserializer
result = []
for i in range(total):
    array = np.array([file1.Rating[i],file1.Cuisine[i],file1.NumberOfReviews[i]])
    res = linear_predictor.predict(array)
    result.append([res['predictions'][0]['score'],res['predictions'][0]['predicted_label']])


print(len(result))
cols = ['bestanswer','score']
test=pd.DataFrame(columns=cols,data=result)
print(test)
test.to_csv('./res.csv')