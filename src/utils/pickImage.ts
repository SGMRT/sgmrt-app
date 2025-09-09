import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        selectionLimit: 1,
    });

    if (!result.canceled) {
        const manipulated = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [],
            { format: ImageManipulator.SaveFormat.JPEG }
        );
        return manipulated;
    }

    return null;
};
