import pika
import json 
import time
import os
from dotenv import load_dotenv

load_dotenv("C:/Users/rocio/IdeaProjects/TFG/backend/.env")

RABBIT_HOST = os.getenv("rabbit_host")
RABBIT_PORT = int(os.getenv("rabbit_port"))
HOST = os.getenv("DB_HOST")

connection = pika.BlockingConnection(
    #pika.ConnectionParameters(host=RABBIT_HOST, port=RABBIT_PORT)
    pika.ConnectionParameters(host=HOST)
)
channel = connection.channel()

channel.queue_declare(queue="rpc_queue")


def on_request_java(name, body):
    print("java")
    test_result = {
        "Student ID": "niub20217245",
        "Checks Initialization": "```\nObtaining ASTs for file list...\nObtaining AST for file /home/dortiz/teaching/software/golem/golem_python_checks/data/Udane_Parcial2.ipynb.py ...\nObtaining non-nested functions to be kept...\nNon-nested function information:\nquants_1 : (<ast.FunctionDef object at 0x7fc375ffbfa0>,64)\nparts_llista : (<ast.FunctionDef object at 0x7fc375ffa1a0>,207)\nsubcadena_mes_llarga_repetits : (<ast.FunctionDef object at 0x7fc375ff8640>,154)\nNon-nested functions to be kept: [<ast.FunctionDef object at 0x7fc375ffbfa0>, <ast.FunctionDef object at 0x7fc375ffa1a0>, <ast.FunctionDef object at 0x7fc375ff8640>]\nRemoving undesired nodes...\nCreating module for submission...\n```",
        "Checks Execution": {
            "Function quants_1 ": {
            "Results": [
                "Asserts passed: True"
            ],
            "LLM Asserts gpt-3.5-turbo": {
                "Model ": "gpt-3.5-turbo ",
                "Input": "```\n[{'role': 'system', 'content': \"You are a teacher who should provide feedback for undergraduate computer programming assignments. You will be provided with the code of a Python function implemented by a student called 'quants_1'. Given an ordered list consisting of only the numbers 0 and 1, the 'quants_1' function should calculate the number of ones (1) contained in the list. The function should take advantage of the fact that the list is sorted to improve efficiency, otherwise, it will be considered erroneous.\\n\\nPlease, when providing feedback, strictly adhere to the structure provided in the examples below.\\n\\nThe code should pass the following asserts:\\n\\n```\\nassert quants_1([0, 0, 1, 1, 1, 1, 1])== 5\\nassert quants_1([0, 0, 0, 0, 1, 1, 1])== 3\\nassert quants_1([1, 1, 1])== 3\\n```\\n\"}, {'role': 'user', 'content': 'Q: Please provide feedback for the following implementation of \\'quants_1\\'. The feedback should have only the following sections \"**Feedback**\", \"##Brief Code Explanation\" where function correctness is indicated, \"**Main Issues (if the function is not correct)**\" and \"**Corrected Version (if the function is not correct)**\".\\n\\n```\\ndef quants_1(arr):\\n    left, right = 0, len(arr) - 1\\n    # Perform binary search for the first occurrence of 1\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1  # search the right half\\n        else:\\n            right = mid - 1  # search the left half to find the first 1\\n\\n    # After binary search, left will be at the index of the first 1\\n    # If left is out of bounds or there are no 1s, return 0\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    # The number of 1s is the length of the list minus the index of the first 1\\n    return len(arr) - left\\n```\\n\\n**Feedback**\\n\\n**Brief Code Explanation**\\n\\n1. Set left to 0 (start of the list) and right to len(arr) - 1 (end of the list).\\n2. While left is less than or equal to right, continue the loop.\\n3. Compute the middle index: mid = (left + right) // 2.\\n4. If arr[mid] == 0, move left to mid + 1 to search the right half. If arr[mid] == 1, move right to mid - 1 to search the left half.\\n5. The loop stops when left is greater than right. At this point, left points to the first 1 (if it exists).\\n6. Check if left is within bounds and if arr[left] == 1. If not, return 0 since there are no 1s.\\n7. If left points to the first 1, the number of 1s is len(arr) - left. Return this value.\\n\\nIs the function correct according to the problem definition [YES/NO]? YES\\n\\n**Main Issues (if the function is not correct)**\\n\\nNone\\n\\n**Corrected Version (if the function is not correct)**\\n\\nNone\\n\\nQ: Please provide feedback for the following implementation of \\'quants_1\\'. The feedback should have only the following sections \"**Feedback**\", \"##Brief Code Explanation\" where function correctness is indicated, \"**Main Issues (if the function is not correct)**\" and \"**Corrected Version (if the function is not correct)**\".\\n\\n```\\ndef quants_1_naive(arr):\\n    count = 0\\n    for num in arr:\\n        if num == 1:\\n            count += 1\\n    return count\\n```\\n\\n**Feedback**\\n\\n**Brief Code Explanation**\\n\\n1. Initialize count to 0.\\n2. Loop through each element in the list.\\n3. For each element, if it is 1, increment count by 1.\\n4. After the loop ends, return the value of count.\\n\\nIs the function correct according to the problem definition [YES/NO]? NO\\n\\n**Main Issues (if the function is not correct)**\\n\\n- Despite the fact that the function passes the assertions, it has a linear computational cost because it does not take advantage of the fact that the list is sorted. By taking advantage of the sorted list, a version with logarithmic cost can be implemented.\\n\\n**Corrected Version (if the function is not correct)**\\n\\n```\\ndef quants_1(arr):\\n    left, right = 0, len(arr) - 1\\n    # Perform binary search for the first occurrence of 1\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1  # search the right half\\n        else:\\n            right = mid - 1  # search the left half to find the first 1\\n\\n    # After binary search, left will be at the index of the first 1\\n    # If left is out of bounds or there are no 1s, return 0\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    # The number of 1s is the length of the list minus the index of the first 1\\n    return len(arr) - left\\n```\\n\\nQ: Please provide feedback for the following implementation of \\'quants_1\\'. The feedback should have only the following sections \"**Feedback**\", \"##Brief Code Explanation\" where function correctness is indicated, \"**Main Issues (if the function is not correct)**\" and \"**Corrected Version (if the function is not correct)**\".\\n\\n```\\ndef quants_1_mistake(arr):\\n    left, right = 0, len(arr) - 1\\n\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1\\n        else:\\n            left = mid\\n\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    return len(arr) - left\\n```\\n\\n**Feedback**\\n\\n**Brief Code Explanation**\\n\\n1. Set left to 0 (start of the list) and right to len(arr) - 1 (end of the list).\\n2. While left is less than or equal to right, continue the loop.\\n3. Compute the middle index: mid = (left + right) // 2.\\n4. If arr[mid] == 0, move left to mid + 1 to search the right half. If arr[mid] == 1, move left to mid.\\n5. The loop stops when left is greater than right.\\n6. Check if left is within bounds and if arr[left] == 1. If not, return 0.\\n7. If left points to a 1, the number of 1s is len(arr) - left. Return this value.\\n\\nIs the function correct according to the problem definition [YES/NO]? NO\\n\\n**Main Issues (if the function is not correct)**\\n\\n- The \"right\" variable is not updated. Instead of updating the right pointer to mid - 1 to continue searching the left half for the first occurrence of 1, the code updates left = mid. This effectively narrows the search range improperly because mid is still included in the search, leading to an infinite loop or failing to find the correct first 1.\\n\\n**Corrected Version (if the function is not correct)**\\n\\n```\\ndef quants_1(arr):\\n    left, right = 0, len(arr) - 1\\n    # Perform binary search for the first occurrence of 1\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1  # search the right half\\n        else:\\n            right = mid - 1  # search the left half to find the first 1\\n\\n    # After binary search, left will be at the index of the first 1\\n    # If left is out of bounds or there are no 1s, return 0\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    # The number of 1s is the length of the list minus the index of the first 1\\n    return len(arr) - left\\n```\\n\\nQ: Please provide feedback for the following implementation of \\'quants_1\\'. The feedback should have only the following sections \"**Feedback**\", \"##Brief Code Explanation\" where function correctness is indicated, \"**Main Issues (if the function is not correct)**\" and \"**Corrected Version (if the function is not correct)**\".\\n```\\ndef quants_1(llistaBinaria):\\n    n = len(llistaBinaria)\\n    i = 0\\n    trobat = False\\n    while ((trobat == 0) and (i < n)):\\n        if (llistaBinaria[i] == 1):\\n            trobat = True\\n        else:\\n            i += 1\\n    num = (n - i)\\n    return num```\\n'}]\n```",
                "Output": "```\nChatCompletion(id='chatcmpl-ApFLn3iVzJlmTOplXpPSxVdN5qpdj', choices=[Choice(finish_reason='stop', index=0, logprobs=None, message=ChatCompletionMessage(content=\"**Feedback**\\n\\n**Brief Code Explanation**\\n\\n1. Initialize the length of the input list to 'n'.\\n2. Initialize 'i' to 0 and 'trobat' to False.\\n3. While 'trobat' is False and 'i' is less than 'n', iterate through the list.\\n4. If the element at index 'i' is 1, set 'trobat' to True; otherwise, increment 'i'.\\n5. Calculate the number of 1s as 'n - i' and return this value.\\n\\nIs the function correct according to the problem definition [YES/NO]? NO\\n\\n**Main Issues (if the function is not correct)**\\n\\n- The function uses a linear search approach to find the first occurrence of 1 in the list. This method does not take advantage of the fact that the list is sorted, leading to inefficiency.\\n\\n**Corrected Version (if the function is not correct)**\\n\\n```\\ndef quants_1(arr):\\n    left, right = 0, len(arr) - 1\\n    # Perform binary search for the first occurrence of 1\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1  # search the right half\\n        else:\\n            right = mid - 1  # search the left half to find the first 1\\n\\n    # After binary search, left will be at the index of the first 1\\n    # If left is out of bounds or there are no 1s, return 0\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    # The number of 1s is the length of the list minus the index of the first 1\\n    return len(arr) - left\\n```\", refusal=None, role='assistant', audio=None, function_call=None, tool_calls=None))], created=1736777099, model='gpt-3.5-turbo-0125', object='chat.completion', service_tier='default', system_fingerprint=None, usage=CompletionUsage(completion_tokens=381, prompt_tokens=1956, total_tokens=2337, completion_tokens_details=CompletionTokensDetails(accepted_prediction_tokens=0, audio_tokens=0, reasoning_tokens=0, rejected_prediction_tokens=0), prompt_tokens_details=PromptTokensDetails(audio_tokens=0, cached_tokens=1920)))\n```",
                "Submitted Code": "```\ndef quants_1(llistaBinaria):\n    n = len(llistaBinaria)\n    i = 0\n    trobat = False\n    while ((trobat == 0) and (i < n)):\n        if (llistaBinaria[i] == 1):\n            trobat = True\n        else:\n            i += 1\n    num = (n - i)\n    return num\n```\n\n###**Feedback**\n\n**Feedback**\n\n**Brief Code Explanation**\n\n[\"Initialize the length of the input list to 'n'.\", \"Initialize 'i' to 0 and 'trobat' to False.\", \"While 'trobat' is False and 'i' is less than 'n', iterate through the list.\", \"If the element at index 'i' is 1, set 'trobat' to True; otherwise, increment 'i'.\", \"Calculate the number of 1s as 'n - i' and return this value.\"]\n\nIs the function correct according to the problem definition [YES/NO]? NO\n\n**Main Issues (if the function is not correct)**\n\n['The function uses a linear search approach to find the first occurrence of 1 in the list. This method does not take advantage of the fact that the list is sorted, leading to inefficiency.']\n\n**Corrected Version (if the function is not correct)**\n\n```\ndef quants_1(arr):\n    left, right = 0, len(arr) - 1\n    # Perform binary search for the first occurrence of 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == 0:\n            left = mid + 1  # search the right half\n        else:\n            right = mid - 1  # search the left half to find the first 1\n\n    # After binary search, left will be at the index of the first 1\n    # If left is out of bounds or there are no 1s, return 0\n    if left >= len(arr) or arr[left] != 1:\n        return 0\n\n    # The number of 1s is the length of the list minus the index of the first 1\n    return len(arr) - left\n```\n\n**Main Issues**\n0 The function uses a linear search approach to find the first occurrence of 1 in the list. This method does not take advantage of the fact that the list is sorted, leading to inefficiency.\n\n['LLM correctness prediction: 0', 'LLM correctness prediction not found: 0', 'LLM correctness prediction ok: 0', 'Corrected version compiles: 1', 'Corrected version runtime exception: 1', 'Corrected version passes asserts: 0', 'At least one issue: 0', 'Uninvolved issues: 1', 'Manual evaluation required: 0', 'Misplaced code: 0', 'Correct structure: 3']"
            }
            }
        }
    }
    '''test_result = {
        "testResult": {
            "studentId": "12345",
            "testDate": "2024-12-18T10:30:00Z",
            "language": "Java",
            "score": 66,
            "totalQuestions": 3,
            "correctAnswers": 2,
            "incorrectAnswers": 1,
            "timeTaken": "15 minutes",
            "questions": [
                {
                    "questionId": 1,
                    "language": "Java",
                    "question": "What is the default value of an int variable in Java?",
                    "correctAnswer": "0",
                    "userAnswer": "0",
                    "isCorrect": True
                },
                {
                    "questionId": 2,
                    "language": "Java",
                    "question": "Which of the following is used to define a constant in Java?",
                    "correctAnswer": "final",
                    "userAnswer": "final",
                    "isCorrect": True
                },
                {
                    "questionId": 3,
                    "language": "Java",
                    "question": "Which keyword is used to inherit a class in Java?",
                    "correctAnswer": "extends",
                    "userAnswer": "implements",
                    "isCorrect": False
                }
            ],
            "feedback": {
                "generalComments": "Good understanding of basic Java concepts. Mistaken the inheritance keyword.",
                "areasForImprovement": [
                    "Java inheritance concepts",
                    "Java keyword usage"
                ],
                "recommendedResources": [
                    "Java Inheritance Tutorial",
                    "Java Official Documentation"
                ]
            }
        }
    }'''
    body_dict = json.loads(body.decode("utf-8"))
    body_dict["info"] = json.dumps(test_result)
    print(body_dict)
    return json.dumps(body_dict) 

def on_request_python(name, body):
    print("python")
    test_result = {
        "Student ID": "niub20217245",
        "Checks Initialization": "```\nObtaining ASTs for file list...\nObtaining AST for file /home/dortiz/teaching/software/golem/golem_python_checks/data/Udane_Parcial2.ipynb.py ...\nObtaining non-nested functions to be kept...\nNon-nested function information:\nquants_1 : (<ast.FunctionDef object at 0x7fc375ffbfa0>,64)\nparts_llista : (<ast.FunctionDef object at 0x7fc375ffa1a0>,207)\nsubcadena_mes_llarga_repetits : (<ast.FunctionDef object at 0x7fc375ff8640>,154)\nNon-nested functions to be kept: [<ast.FunctionDef object at 0x7fc375ffbfa0>, <ast.FunctionDef object at 0x7fc375ffa1a0>, <ast.FunctionDef object at 0x7fc375ff8640>]\nRemoving undesired nodes...\nCreating module for submission...\n```",
        "Checks Execution": {
            "Function quants_1 ": {
            "Results": [
                "Asserts passed: True"
            ],
            "LLM Asserts gpt-3.5-turbo": {
                "Model ": "gpt-3.5-turbo ",
                "Input": "```\n[{'role': 'system', 'content': \"You are a teacher who should provide feedback for undergraduate computer programming assignments. You will be provided with the code of a Python function implemented by a student called 'quants_1'. Given an ordered list consisting of only the numbers 0 and 1, the 'quants_1' function should calculate the number of ones (1) contained in the list. The function should take advantage of the fact that the list is sorted to improve efficiency, otherwise, it will be considered erroneous.\\n\\nPlease, when providing feedback, strictly adhere to the structure provided in the examples below.\\n\\nThe code should pass the following asserts:\\n\\n```\\nassert quants_1([0, 0, 1, 1, 1, 1, 1])== 5\\nassert quants_1([0, 0, 0, 0, 1, 1, 1])== 3\\nassert quants_1([1, 1, 1])== 3\\n```\\n\"}, {'role': 'user', 'content': 'Q: Please provide feedback for the following implementation of \\'quants_1\\'. The feedback should have only the following sections \"**Feedback**\", \"##Brief Code Explanation\" where function correctness is indicated, \"**Main Issues (if the function is not correct)**\" and \"**Corrected Version (if the function is not correct)**\".\\n\\n```\\ndef quants_1(arr):\\n    left, right = 0, len(arr) - 1\\n    # Perform binary search for the first occurrence of 1\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1  # search the right half\\n        else:\\n            right = mid - 1  # search the left half to find the first 1\\n\\n    # After binary search, left will be at the index of the first 1\\n    # If left is out of bounds or there are no 1s, return 0\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    # The number of 1s is the length of the list minus the index of the first 1\\n    return len(arr) - left\\n```\\n\\n**Feedback**\\n\\n**Brief Code Explanation**\\n\\n1. Set left to 0 (start of the list) and right to len(arr) - 1 (end of the list).\\n2. While left is less than or equal to right, continue the loop.\\n3. Compute the middle index: mid = (left + right) // 2.\\n4. If arr[mid] == 0, move left to mid + 1 to search the right half. If arr[mid] == 1, move right to mid - 1 to search the left half.\\n5. The loop stops when left is greater than right. At this point, left points to the first 1 (if it exists).\\n6. Check if left is within bounds and if arr[left] == 1. If not, return 0 since there are no 1s.\\n7. If left points to the first 1, the number of 1s is len(arr) - left. Return this value.\\n\\nIs the function correct according to the problem definition [YES/NO]? YES\\n\\n**Main Issues (if the function is not correct)**\\n\\nNone\\n\\n**Corrected Version (if the function is not correct)**\\n\\nNone\\n\\nQ: Please provide feedback for the following implementation of \\'quants_1\\'. The feedback should have only the following sections \"**Feedback**\", \"##Brief Code Explanation\" where function correctness is indicated, \"**Main Issues (if the function is not correct)**\" and \"**Corrected Version (if the function is not correct)**\".\\n\\n```\\ndef quants_1_naive(arr):\\n    count = 0\\n    for num in arr:\\n        if num == 1:\\n            count += 1\\n    return count\\n```\\n\\n**Feedback**\\n\\n**Brief Code Explanation**\\n\\n1. Initialize count to 0.\\n2. Loop through each element in the list.\\n3. For each element, if it is 1, increment count by 1.\\n4. After the loop ends, return the value of count.\\n\\nIs the function correct according to the problem definition [YES/NO]? NO\\n\\n**Main Issues (if the function is not correct)**\\n\\n- Despite the fact that the function passes the assertions, it has a linear computational cost because it does not take advantage of the fact that the list is sorted. By taking advantage of the sorted list, a version with logarithmic cost can be implemented.\\n\\n**Corrected Version (if the function is not correct)**\\n\\n```\\ndef quants_1(arr):\\n    left, right = 0, len(arr) - 1\\n    # Perform binary search for the first occurrence of 1\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1  # search the right half\\n        else:\\n            right = mid - 1  # search the left half to find the first 1\\n\\n    # After binary search, left will be at the index of the first 1\\n    # If left is out of bounds or there are no 1s, return 0\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    # The number of 1s is the length of the list minus the index of the first 1\\n    return len(arr) - left\\n```\\n\\nQ: Please provide feedback for the following implementation of \\'quants_1\\'. The feedback should have only the following sections \"**Feedback**\", \"##Brief Code Explanation\" where function correctness is indicated, \"**Main Issues (if the function is not correct)**\" and \"**Corrected Version (if the function is not correct)**\".\\n\\n```\\ndef quants_1_mistake(arr):\\n    left, right = 0, len(arr) - 1\\n\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1\\n        else:\\n            left = mid\\n\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    return len(arr) - left\\n```\\n\\n**Feedback**\\n\\n**Brief Code Explanation**\\n\\n1. Set left to 0 (start of the list) and right to len(arr) - 1 (end of the list).\\n2. While left is less than or equal to right, continue the loop.\\n3. Compute the middle index: mid = (left + right) // 2.\\n4. If arr[mid] == 0, move left to mid + 1 to search the right half. If arr[mid] == 1, move left to mid.\\n5. The loop stops when left is greater than right.\\n6. Check if left is within bounds and if arr[left] == 1. If not, return 0.\\n7. If left points to a 1, the number of 1s is len(arr) - left. Return this value.\\n\\nIs the function correct according to the problem definition [YES/NO]? NO\\n\\n**Main Issues (if the function is not correct)**\\n\\n- The \"right\" variable is not updated. Instead of updating the right pointer to mid - 1 to continue searching the left half for the first occurrence of 1, the code updates left = mid. This effectively narrows the search range improperly because mid is still included in the search, leading to an infinite loop or failing to find the correct first 1.\\n\\n**Corrected Version (if the function is not correct)**\\n\\n```\\ndef quants_1(arr):\\n    left, right = 0, len(arr) - 1\\n    # Perform binary search for the first occurrence of 1\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1  # search the right half\\n        else:\\n            right = mid - 1  # search the left half to find the first 1\\n\\n    # After binary search, left will be at the index of the first 1\\n    # If left is out of bounds or there are no 1s, return 0\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    # The number of 1s is the length of the list minus the index of the first 1\\n    return len(arr) - left\\n```\\n\\nQ: Please provide feedback for the following implementation of \\'quants_1\\'. The feedback should have only the following sections \"**Feedback**\", \"##Brief Code Explanation\" where function correctness is indicated, \"**Main Issues (if the function is not correct)**\" and \"**Corrected Version (if the function is not correct)**\".\\n```\\ndef quants_1(llistaBinaria):\\n    n = len(llistaBinaria)\\n    i = 0\\n    trobat = False\\n    while ((trobat == 0) and (i < n)):\\n        if (llistaBinaria[i] == 1):\\n            trobat = True\\n        else:\\n            i += 1\\n    num = (n - i)\\n    return num```\\n'}]\n```",
                "Output": "```\nChatCompletion(id='chatcmpl-ApFLn3iVzJlmTOplXpPSxVdN5qpdj', choices=[Choice(finish_reason='stop', index=0, logprobs=None, message=ChatCompletionMessage(content=\"**Feedback**\\n\\n**Brief Code Explanation**\\n\\n1. Initialize the length of the input list to 'n'.\\n2. Initialize 'i' to 0 and 'trobat' to False.\\n3. While 'trobat' is False and 'i' is less than 'n', iterate through the list.\\n4. If the element at index 'i' is 1, set 'trobat' to True; otherwise, increment 'i'.\\n5. Calculate the number of 1s as 'n - i' and return this value.\\n\\nIs the function correct according to the problem definition [YES/NO]? NO\\n\\n**Main Issues (if the function is not correct)**\\n\\n- The function uses a linear search approach to find the first occurrence of 1 in the list. This method does not take advantage of the fact that the list is sorted, leading to inefficiency.\\n\\n**Corrected Version (if the function is not correct)**\\n\\n```\\ndef quants_1(arr):\\n    left, right = 0, len(arr) - 1\\n    # Perform binary search for the first occurrence of 1\\n    while left <= right:\\n        mid = (left + right) // 2\\n        if arr[mid] == 0:\\n            left = mid + 1  # search the right half\\n        else:\\n            right = mid - 1  # search the left half to find the first 1\\n\\n    # After binary search, left will be at the index of the first 1\\n    # If left is out of bounds or there are no 1s, return 0\\n    if left >= len(arr) or arr[left] != 1:\\n        return 0\\n\\n    # The number of 1s is the length of the list minus the index of the first 1\\n    return len(arr) - left\\n```\", refusal=None, role='assistant', audio=None, function_call=None, tool_calls=None))], created=1736777099, model='gpt-3.5-turbo-0125', object='chat.completion', service_tier='default', system_fingerprint=None, usage=CompletionUsage(completion_tokens=381, prompt_tokens=1956, total_tokens=2337, completion_tokens_details=CompletionTokensDetails(accepted_prediction_tokens=0, audio_tokens=0, reasoning_tokens=0, rejected_prediction_tokens=0), prompt_tokens_details=PromptTokensDetails(audio_tokens=0, cached_tokens=1920)))\n```",
                "Submitted Code": "```\ndef quants_1(llistaBinaria):\n    n = len(llistaBinaria)\n    i = 0\n    trobat = False\n    while ((trobat == 0) and (i < n)):\n        if (llistaBinaria[i] == 1):\n            trobat = True\n        else:\n            i += 1\n    num = (n - i)\n    return num\n```\n\n###**Feedback**\n\n**Feedback**\n\n**Brief Code Explanation**\n\n[\"Initialize the length of the input list to 'n'.\", \"Initialize 'i' to 0 and 'trobat' to False.\", \"While 'trobat' is False and 'i' is less than 'n', iterate through the list.\", \"If the element at index 'i' is 1, set 'trobat' to True; otherwise, increment 'i'.\", \"Calculate the number of 1s as 'n - i' and return this value.\"]\n\nIs the function correct according to the problem definition [YES/NO]? NO\n\n**Main Issues (if the function is not correct)**\n\n['The function uses a linear search approach to find the first occurrence of 1 in the list. This method does not take advantage of the fact that the list is sorted, leading to inefficiency.']\n\n**Corrected Version (if the function is not correct)**\n\n```\ndef quants_1(arr):\n    left, right = 0, len(arr) - 1\n    # Perform binary search for the first occurrence of 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == 0:\n            left = mid + 1  # search the right half\n        else:\n            right = mid - 1  # search the left half to find the first 1\n\n    # After binary search, left will be at the index of the first 1\n    # If left is out of bounds or there are no 1s, return 0\n    if left >= len(arr) or arr[left] != 1:\n        return 0\n\n    # The number of 1s is the length of the list minus the index of the first 1\n    return len(arr) - left\n```\n\n**Main Issues**\n0 The function uses a linear search approach to find the first occurrence of 1 in the list. This method does not take advantage of the fact that the list is sorted, leading to inefficiency.\n\n['LLM correctness prediction: 0', 'LLM correctness prediction not found: 0', 'LLM correctness prediction ok: 0', 'Corrected version compiles: 1', 'Corrected version runtime exception: 1', 'Corrected version passes asserts: 0', 'At least one issue: 0', 'Uninvolved issues: 1', 'Manual evaluation required: 0', 'Misplaced code: 0', 'Correct structure: 3']"
            }
            }
        }
    }
    '''test_result = {
        "testResult": {
            "studentId": "12345",
            "testDate": "2024-12-18T10:30:00Z",
            "language": "Java",
            "score": 66,
            "totalQuestions": 3,
            "correctAnswers": 2,
            "incorrectAnswers": 1,
            "timeTaken": "15 minutes",
            "questions": [
                {
                    "questionId": 1,
                    "language": "Java",
                    "question": "What is the default value of an int variable in Java?",
                    "correctAnswer": "0",
                    "userAnswer": "0",
                    "isCorrect": True
                },
                {
                    "questionId": 2,
                    "language": "Java",
                    "question": "Which of the following is used to define a constant in Java?",
                    "correctAnswer": "final",
                    "userAnswer": "final",
                    "isCorrect": True
                },
                {
                    "questionId": 3,
                    "language": "Java",
                    "question": "Which keyword is used to inherit a class in Java?",
                    "correctAnswer": "extends",
                    "userAnswer": "implements",
                    "isCorrect": False
                }
            ],
            "feedback": {
                "generalComments": "Good understanding of basic Java concepts. Mistaken the inheritance keyword.",
                "areasForImprovement": [
                    "Java inheritance concepts",
                    "Java keyword usage"
                ],
                "recommendedResources": [
                    "Java Inheritance Tutorial",
                    "Java Official Documentation"
                ]
            }
        }
    }'''
    body_dict = json.loads(body.decode("utf-8"))
    body_dict["info"] = json.dumps(test_result)
    print(body_dict)
    return json.dumps(body_dict) 

def on_request(ch, method, props, body):
    print("Mensaje recibido en el servidor:", body.decode("utf-8"))
    string = body.decode("utf-8")
    resposta  = json.loads(string)
    idiomaP = resposta.get('idiomaP')
    name = resposta.get('name')

    if idiomaP == "java":
        print(f" Pràctica({name})")
        response = on_request_java(name, body)
    else:
        print(f" Pràctica({name})")
        response = on_request_python(name, body)

    print(f"Publicando Server en la cola: {props.reply_to}")
    print(f"Respuesta: {response}")
    ch.basic_publish(
        exchange="",
        routing_key=props.reply_to,
        properties=pika.BasicProperties(correlation_id=props.correlation_id),
        body=response,
    )
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue="rpc_queue", on_message_callback=on_request)

print(" [x] Awaiting RPC requests")
channel.start_consuming()