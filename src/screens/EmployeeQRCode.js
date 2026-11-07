import { StyleSheet, Text, View } from 'react-native';
import ScreenLayout from '../components/ScreenLayout';
import { colors } from '../theme';
import { mockEmployee } from '../mockData';
import Qrcode from 'react-native-qrcode-svg';

const EmployeeQRCode = ({ navigation }) => {
    const employee = mockEmployee;
    const employeePayload = JSON.stringify(employee);

    return (
        <ScreenLayout 
            title = 'Employee QR Code'
            backLabel="Back"
            onBack={() => navigation?.goBack?.()}
            badge="● CLIENT"
            onAccount={() => navigation.navigate('AccountSettings')}
            >
            <View style={styles.container} >
                <View style={styles.card}>
                    <Text style={[styles.text]}>{employee.name}</Text>
                    <Text style={[styles.roleText]}>{employee.role}</Text>
                    <Qrcode
                        value={employeePayload}
                        size={200}
                        backgroundColor={colors.accent}
                    />
                    <Text style={[styles.text]}>{employee.id}</Text>
                </View>
            </View>
        </ScreenLayout>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        backgroundColor: colors.card,
        borderColor: colors.accent,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        alignSelf: 'center',
        textAlign: 'center',
        marginVertical: 6,
    },
    roleText: {
        fontSize: 18,
        color: colors.muted,
        alignSelf: 'center',
        textAlign: 'center',
        marginVertical: 4,
        marginBottom: 16,
    },

});

export default EmployeeQRCode;